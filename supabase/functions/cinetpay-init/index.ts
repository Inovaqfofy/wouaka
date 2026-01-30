import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  plan_id: string;
  plan_name: string;
  amount: number;
  customer_name: string;
  customer_surname: string;
  customer_email: string;
  customer_phone_number?: string;
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

    if (!cinetpayApiKey || !cinetpaySiteId) {
      console.error('[CinetPay] Missing API credentials')
      return new Response(
        JSON.stringify({ error: 'CinetPay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: PaymentRequest = await req.json()
    console.log('[CinetPay] Initiating payment:', body)

    // Validate required fields
    if (!body.plan_id || !body.amount || !body.customer_name || !body.customer_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique transaction ID
    const transactionId = `WOK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Get the base URL for callbacks - PRODUCTION: www.wouaka-creditscore.com
    const PRODUCTION_DOMAIN = 'https://www.wouaka-creditscore.com'
    const notifyUrl = `${supabaseUrl}/functions/v1/cinetpay-webhook`
    const returnUrl = `${req.headers.get('origin') || PRODUCTION_DOMAIN}/payment/confirmation?transaction_id=${transactionId}`

    // Prepare CinetPay payment request
    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: cinetpaySiteId,
      transaction_id: transactionId,
      amount: body.amount,
      currency: 'XOF',
      description: `Abonnement ${body.plan_name}`,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: 'ALL',
      metadata: JSON.stringify({
        user_id: user.id,
        plan_id: body.plan_id,
        plan_name: body.plan_name
      }),
      customer_name: body.customer_name,
      customer_surname: body.customer_surname || body.customer_name,
      customer_email: body.customer_email,
      customer_phone_number: body.customer_phone_number || '',
      customer_address: 'Abidjan',
      customer_city: 'Abidjan',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00225',
      lang: 'FR'
    }

    console.log('[CinetPay] Sending request to CinetPay API')

    // Call CinetPay API
    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cinetpayPayload),
    })

    const cinetpayData = await cinetpayResponse.json()
    console.log('[CinetPay] Response:', cinetpayData)

    if (cinetpayData.code !== '201') {
      console.error('[CinetPay] Error from CinetPay:', cinetpayData)
      return new Response(
        JSON.stringify({ 
          error: 'Payment initialization failed', 
          details: cinetpayData.message || cinetpayData.description 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store transaction in database
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: body.plan_id,
        transaction_id: transactionId,
        amount: body.amount,
        currency: 'XOF',
        status: 'pending',
        payment_url: cinetpayData.data.payment_url,
        payment_token: cinetpayData.data.payment_token,
        metadata: {
          plan_name: body.plan_name,
          customer_name: body.customer_name,
          customer_email: body.customer_email
        }
      })

    if (insertError) {
      console.error('[CinetPay] Error storing transaction:', insertError)
      // Still return the payment URL even if we couldn't store it
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_url: cinetpayData.data.payment_url,
        payment_token: cinetpayData.data.payment_token
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CinetPay] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
