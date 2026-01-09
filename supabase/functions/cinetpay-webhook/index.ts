import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cinetpayApiKey = Deno.env.get('CINETPAY_API_KEY')
    const cinetpaySiteId = Deno.env.get('CINETPAY_SITE_ID')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook data - CinetPay sends data as form-urlencoded or JSON
    let webhookData: any = {}
    
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      webhookData = await req.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      for (const [key, value] of formData.entries()) {
        webhookData[key] = value
      }
    } else {
      // Try to get from URL params for GET requests
      const url = new URL(req.url)
      for (const [key, value] of url.searchParams.entries()) {
        webhookData[key] = value
      }
    }

    console.log('[CinetPay Webhook] Received:', webhookData)

    const transactionId = webhookData.cpm_trans_id || webhookData.transaction_id
    
    if (!transactionId) {
      console.error('[CinetPay Webhook] No transaction ID in webhook data')
      return new Response(
        JSON.stringify({ error: 'Missing transaction_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify payment status with CinetPay API
    console.log('[CinetPay Webhook] Verifying transaction:', transactionId)
    
    const verifyResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: cinetpayApiKey,
        site_id: cinetpaySiteId,
        transaction_id: transactionId
      }),
    })

    const verifyData = await verifyResponse.json()
    console.log('[CinetPay Webhook] Verification response:', verifyData)

    // Get the existing transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*, plan:subscription_plans(*)')
      .eq('transaction_id', transactionId)
      .single()

    if (fetchError || !transaction) {
      console.error('[CinetPay Webhook] Transaction not found:', transactionId)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine the new status
    let newStatus = 'pending'
    let paidAt = null

    if (verifyData.code === '00' && verifyData.data?.status === 'ACCEPTED') {
      newStatus = 'completed'
      paidAt = new Date().toISOString()
    } else if (verifyData.data?.status === 'REFUSED') {
      newStatus = 'failed'
    } else if (verifyData.data?.status === 'CANCELLED') {
      newStatus = 'cancelled'
    }

    console.log('[CinetPay Webhook] Updating transaction status to:', newStatus)

    // Update transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        paid_at: paidAt,
        payment_method: verifyData.data?.payment_method || null,
        cinetpay_data: verifyData
      })
      .eq('transaction_id', transactionId)

    if (updateError) {
      console.error('[CinetPay Webhook] Error updating transaction:', updateError)
    }

    // If payment successful, activate/update subscription
    if (newStatus === 'completed' && transaction.plan_id) {
      console.log('[CinetPay Webhook] Activating subscription for user:', transaction.user_id)

      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      // Check if user has existing subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', transaction.user_id)
        .maybeSingle()

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update({
            plan_id: transaction.plan_id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            canceled_at: null
          })
          .eq('user_id', transaction.user_id)
      } else {
        // Create new subscription
        await supabase
          .from('subscriptions')
          .insert({
            user_id: transaction.user_id,
            plan_id: transaction.plan_id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString()
          })
      }

      // Create invoice automatically
      console.log('[CinetPay Webhook] Creating invoice for transaction:', transaction.id)
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: transaction.user_id,
          transaction_id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'paid',
          paid_at: paidAt,
          metadata: {
            plan_name: transaction.metadata?.plan_name,
            customer_name: transaction.metadata?.customer_name,
            customer_email: transaction.metadata?.customer_email,
            transaction_id: transactionId,
            payment_method: verifyData.data?.payment_method
          }
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('[CinetPay Webhook] Error creating invoice:', invoiceError)
      } else {
        console.log('[CinetPay Webhook] Invoice created:', invoice?.invoice_number)
      }

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          title: 'Paiement confirmé',
          message: `Votre paiement de ${transaction.amount} FCFA a été accepté. Votre abonnement ${transaction.metadata?.plan_name || ''} est maintenant actif. Facture ${invoice?.invoice_number || ''} disponible.`,
          type: 'success',
          action_url: '/dashboard/enterprise/billing'
        })

      console.log('[CinetPay Webhook] Subscription activated successfully')
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CinetPay Webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
