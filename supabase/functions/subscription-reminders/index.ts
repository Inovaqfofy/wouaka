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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Subscription Reminders] Starting reminder check...')

    // Get subscriptions expiring in 7 days, 3 days, and 1 day
    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

    // Format dates for comparison (start of day)
    const formatDateForComparison = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    // Fetch active subscriptions with user profiles
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        current_period_end,
        status,
        plan:subscription_plans(name, price_monthly)
      `)
      .eq('status', 'active')
      .not('current_period_end', 'is', null)

    if (fetchError) {
      console.error('[Subscription Reminders] Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    console.log(`[Subscription Reminders] Found ${subscriptions?.length || 0} active subscriptions`)

    const results = {
      reminders_sent: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    for (const subscription of subscriptions || []) {
      if (!subscription.current_period_end) continue

      const expiryDate = new Date(subscription.current_period_end)
      const expiryDateStr = formatDateForComparison(expiryDate)
      
      let reminderType: '7_days' | '3_days' | '1_day' | null = null
      let reminderMessage = ''

      if (expiryDateStr === formatDateForComparison(sevenDaysFromNow)) {
        reminderType = '7_days'
        reminderMessage = 'Votre abonnement expire dans 7 jours'
      } else if (expiryDateStr === formatDateForComparison(threeDaysFromNow)) {
        reminderType = '3_days'
        reminderMessage = 'Votre abonnement expire dans 3 jours'
      } else if (expiryDateStr === formatDateForComparison(oneDayFromNow)) {
        reminderType = '1_day'
        reminderMessage = 'Votre abonnement expire demain !'
      }

      if (!reminderType) continue

      // Check if we already sent this reminder
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', subscription.user_id)
        .eq('type', 'subscription_reminder')
        .gte('created_at', formatDateForComparison(now))
        .like('message', `%${reminderType === '7_days' ? '7 jours' : reminderType === '3_days' ? '3 jours' : 'demain'}%`)
        .maybeSingle()

      if (existingNotif) {
        console.log(`[Subscription Reminders] Reminder already sent for user ${subscription.user_id}`)
        continue
      }

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', subscription.user_id)
        .single()

      if (!profile) continue

      const planArray = subscription.plan as Array<{ name: string; price_monthly: number }> | null
      const planData = planArray && planArray.length > 0 ? planArray[0] : null
      const planName = planData?.name || 'votre plan'
      const planPrice = planData?.price_monthly || 0

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: subscription.user_id,
          title: 'Rappel d\'abonnement',
          message: `${reminderMessage}. Renouvelez votre abonnement ${planName} pour continuer à bénéficier de nos services.`,
          type: 'subscription_reminder',
          action_url: '/dashboard/enterprise/billing',
          metadata: {
            reminder_type: reminderType,
            expiry_date: subscription.current_period_end,
            plan_name: planName
          }
        })

      if (notifError) {
        console.error('[Subscription Reminders] Error creating notification:', notifError)
        results.errors.push(`Notification error for user ${subscription.user_id}: ${notifError.message}`)
        continue
      }

      // Send email if Resend API key is configured
      if (resendApiKey && profile.email) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Wouaka <noreply@wouaka-creditscore.com>',
              to: [profile.email],
              subject: `${reminderMessage} - Wouaka`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #18181b; margin: 0; font-size: 24px;">🔔 Rappel d'abonnement</h1>
                      </div>
                      
                      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                        Bonjour ${profile.full_name || 'cher client'},
                      </p>
                      
                      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                        ${reminderMessage}. Pour continuer à utiliser les services Wouaka sans interruption, 
                        pensez à renouveler votre abonnement.
                      </p>
                      
                      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">Votre abonnement actuel</p>
                        <p style="margin: 0; color: #18181b; font-size: 20px; font-weight: bold;">${planName}</p>
                        <p style="margin: 8px 0 0 0; color: #52525b; font-size: 16px;">${planPrice.toLocaleString()} FCFA / mois</p>
                      </div>
                      
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="https://wouaka-creditscore.com/dashboard/enterprise/billing" 
                           style="display: inline-block; background-color: #18181b; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                          Renouveler mon abonnement
                        </a>
                      </div>
                      
                      <p style="color: #a1a1aa; font-size: 14px; margin-top: 30px; text-align: center;">
                        Merci de votre confiance.<br>
                        L'équipe Wouaka
                      </p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            }),
          })

          if (!emailResponse.ok) {
            const emailError = await emailResponse.text()
            console.error('[Subscription Reminders] Email error:', emailError)
            results.errors.push(`Email error for ${profile.email}: ${emailError}`)
          } else {
            console.log(`[Subscription Reminders] Email sent to ${profile.email}`)
          }
        } catch (emailErr) {
          console.error('[Subscription Reminders] Email exception:', emailErr)
          results.errors.push(`Email exception for ${profile.email}: ${(emailErr as Error).message}`)
        }
      }

      results.reminders_sent++
      results.details.push({
        user_id: subscription.user_id,
        email: profile.email,
        reminder_type: reminderType,
        plan: planName
      })
    }

    console.log(`[Subscription Reminders] Completed. Sent ${results.reminders_sent} reminders.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.reminders_sent} rappels envoyés`,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Subscription Reminders] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
