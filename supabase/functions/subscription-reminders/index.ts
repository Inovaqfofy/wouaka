import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration des plans emprunteur pour les rappels
const BORROWER_PLAN_NAMES: Record<string, string> = {
  'emprunteur-decouverte': 'Découverte',
  'emprunteur-essentiel': 'Essentiel',
  'emprunteur-premium': 'Premium',
}

interface ReminderResult {
  user_id: string;
  email?: string;
  phone?: string;
  reminder_type: string;
  plan: string;
  type: 'partner' | 'borrower' | 'trial';
  email_sent: boolean;
  sms_sent: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const atUsername = Deno.env.get('AFRICASTALKING_USERNAME')
    const atApiKey = Deno.env.get('AFRICASTALKING_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Reminders] Starting check for partner, borrower, and trial expirations...')

    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

    const formatDateForComparison = (date: Date) => date.toISOString().split('T')[0]

    const results = {
      partner_reminders_sent: 0,
      borrower_reminders_sent: 0,
      trial_reminders_sent: 0,
      emails_sent: 0,
      sms_sent: 0,
      errors: [] as string[],
      details: [] as ReminderResult[]
    }

    // Helper: déterminer le type de rappel
    const getReminderInfo = (expiryDateStr: string) => {
      if (expiryDateStr === formatDateForComparison(sevenDaysFromNow)) {
        return { type: '7_days' as const, message: '7 jours', urgency: 'info' }
      } else if (expiryDateStr === formatDateForComparison(threeDaysFromNow)) {
        return { type: '3_days' as const, message: '3 jours', urgency: 'warning' }
      } else if (expiryDateStr === formatDateForComparison(oneDayFromNow)) {
        return { type: '1_day' as const, message: 'demain', urgency: 'critical' }
      }
      return null
    }

    // Helper: envoyer un email via Resend
    const sendEmail = async (
      email: string, 
      name: string, 
      subject: string, 
      planName: string, 
      reminderMessage: string, 
      actionUrl: string,
      type: 'borrower' | 'partner' | 'trial'
    ) => {
      if (!resendApiKey || !email) return false

      const isTrial = type === 'trial'
      const isBorrower = type === 'borrower'

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Wouaka <noreply@wouaka-creditscore.com>',
            to: [email],
            subject,
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
                      <h1 style="color: #18181b; margin: 0; font-size: 24px;">
                        ${isTrial ? '⏰ Rappel Essai Gratuit' : isBorrower ? '🎫 Rappel Certificat' : '🔔 Rappel Abonnement'}
                      </h1>
                    </div>
                    
                    <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                      Bonjour ${name || 'cher client'},
                    </p>
                    
                    <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                      ${reminderMessage}
                    </p>
                    
                    <div style="background-color: ${isTrial ? '#fef3c7' : '#f4f4f5'}; border-radius: 8px; padding: 20px; margin: 24px 0; ${isTrial ? 'border-left: 4px solid #f59e0b;' : ''}">
                      <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">
                        ${isTrial ? 'Votre essai gratuit' : isBorrower ? 'Votre certificat actuel' : 'Votre abonnement actuel'}
                      </p>
                      <p style="margin: 0; color: #18181b; font-size: 20px; font-weight: bold;">${planName}</p>
                    </div>

                    ${isTrial ? `
                    <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
                      <strong>Attention :</strong> À l'expiration de votre essai, vos clés API seront désactivées et vous ne pourrez plus accéder aux dossiers de preuves.
                    </p>
                    ` : ''}
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://www.wouaka-creditscore.com${actionUrl}" 
                         style="display: inline-block; background-color: ${isTrial ? '#f59e0b' : '#18181b'}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                        ${isTrial ? 'Passer au plan payant' : isBorrower ? 'Renouveler mon certificat' : 'Renouveler mon abonnement'}
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

        if (!response.ok) {
          const error = await response.text()
          console.error('[Reminders] Email error:', error)
          return false
        }
        return true
      } catch (e) {
        console.error('[Reminders] Email exception:', e)
        return false
      }
    }

    // Helper: envoyer un SMS via Africa's Talking
    const sendSMS = async (phone: string, message: string) => {
      if (!atUsername || !atApiKey || !phone) return false

      // Normaliser le numéro de téléphone
      let formattedPhone = phone.replace(/\s/g, '')
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+225' + formattedPhone.substring(1) // Côte d'Ivoire par défaut
        } else {
          formattedPhone = '+' + formattedPhone
        }
      }

      try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': atApiKey,
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            username: atUsername,
            to: formattedPhone,
            message: message,
            from: 'WOUAKA',
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          console.error('[Reminders] SMS error:', error)
          return false
        }

        const result = await response.json()
        console.log('[Reminders] SMS sent:', result)
        return true
      } catch (e) {
        console.error('[Reminders] SMS exception:', e)
        return false
      }
    }

    // ================================================
    // PARTIE 1: Rappels pour les ESSAIS GRATUITS (TRIAL)
    // ================================================
    console.log('[Reminders] Checking partner trials...')
    
    const { data: trialSubs, error: trialError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_end,
        trial_reminder_sent_at,
        plan_id
      `)
      .eq('status', 'trialing')
      .not('trial_end', 'is', null)

    if (trialError) {
      console.error('[Reminders] Error fetching trials:', trialError)
      results.errors.push(`Trial fetch error: ${trialError.message}`)
    }

    for (const trial of trialSubs || []) {
      if (!trial.trial_end) continue

      const expiryDate = new Date(trial.trial_end)
      const reminderInfo = getReminderInfo(formatDateForComparison(expiryDate))
      if (!reminderInfo) continue

      // Vérifier si rappel déjà envoyé aujourd'hui
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', trial.user_id)
        .eq('type', 'trial_reminder')
        .gte('created_at', formatDateForComparison(now))
        .maybeSingle()

      if (existingNotif) continue

      // Récupérer le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, phone, company')
        .eq('id', trial.user_id)
        .single()

      if (!profile) continue

      const userName = profile.full_name || profile.company || 'Partenaire'
      const reminderMessage = `Votre essai gratuit expire dans ${reminderInfo.message}. Passez à un plan payant pour continuer à accéder à l'API WOUAKA et aux dossiers de preuves.`

      // Créer notification in-app
      await supabase.from('notifications').insert({
        user_id: trial.user_id,
        title: `⏰ Essai gratuit : ${reminderInfo.message} restants`,
        message: reminderMessage,
        type: 'trial_reminder',
        action_url: '/dashboard/partner/billing',
        metadata: { 
          reminder_type: reminderInfo.type, 
          trial_end: trial.trial_end,
          urgency: reminderInfo.urgency
        }
      })

      // Mettre à jour le dernier rappel envoyé
      await supabase
        .from('subscriptions')
        .update({ trial_reminder_sent_at: now.toISOString() })
        .eq('id', trial.id)

      // Envoyer email
      const emailSent = await sendEmail(
        profile.email || '',
        userName,
        `${reminderInfo.urgency === 'critical' ? '⚠️ ' : '⏰ '}Votre essai WOUAKA expire dans ${reminderInfo.message}`,
        'Essai Gratuit (14 jours)',
        reminderMessage,
        '/dashboard/partner/billing',
        'trial'
      )
      if (emailSent) results.emails_sent++

      // Envoyer SMS (toujours pour les trials, car c'est important)
      if (profile.phone) {
        const smsMessage = `WOUAKA: Votre essai gratuit expire dans ${reminderInfo.message}. Passez au plan payant sur wouaka-creditscore.com pour ne pas perdre l'accès API.`
        const smsSent = await sendSMS(profile.phone, smsMessage)
        if (smsSent) results.sms_sent++
        
        results.details.push({
          user_id: trial.user_id,
          email: profile.email,
          phone: profile.phone,
          reminder_type: reminderInfo.type,
          plan: 'Essai Gratuit',
          type: 'trial',
          email_sent: emailSent,
          sms_sent: smsSent
        })
      } else {
        results.details.push({
          user_id: trial.user_id,
          email: profile.email,
          reminder_type: reminderInfo.type,
          plan: 'Essai Gratuit',
          type: 'trial',
          email_sent: emailSent,
          sms_sent: false
        })
      }

      results.trial_reminders_sent++
    }

    // ================================================
    // PARTIE 2: Rappels pour les abonnements partenaires (B2B)
    // ================================================
    console.log('[Reminders] Checking partner subscriptions...')
    
    const { data: partnerSubs, error: partnerError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        current_period_end,
        status,
        plan_id
      `)
      .eq('status', 'active')
      .not('current_period_end', 'is', null)

    if (partnerError) {
      console.error('[Reminders] Error fetching partner subscriptions:', partnerError)
      results.errors.push(`Partner fetch error: ${partnerError.message}`)
    }

    for (const sub of partnerSubs || []) {
      if (!sub.current_period_end) continue

      const expiryDate = new Date(sub.current_period_end)
      const reminderInfo = getReminderInfo(formatDateForComparison(expiryDate))
      if (!reminderInfo) continue

      // Vérifier si rappel déjà envoyé aujourd'hui
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('type', 'subscription_reminder')
        .gte('created_at', formatDateForComparison(now))
        .maybeSingle()

      if (existingNotif) continue

      // Récupérer le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', sub.user_id)
        .single()

      if (!profile) continue

      // Récupérer le nom du plan
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('name')
        .eq('id', sub.plan_id)
        .single()

      const planName = plan?.name || 'Votre plan'
      const reminderMessage = `Votre abonnement ${planName} expire dans ${reminderInfo.message}. Renouvelez-le pour continuer à accéder aux dossiers de preuves.`

      // Créer notification in-app
      await supabase.from('notifications').insert({
        user_id: sub.user_id,
        title: 'Rappel d\'abonnement',
        message: reminderMessage,
        type: 'subscription_reminder',
        action_url: '/dashboard/partner/billing',
        metadata: { reminder_type: reminderInfo.type, expiry_date: sub.current_period_end, plan_name: planName }
      })

      // Envoyer email
      const emailSent = await sendEmail(
        profile.email || '',
        profile.full_name || '',
        `${reminderInfo.urgency === 'critical' ? '⚠️ ' : ''}Votre abonnement Wouaka expire dans ${reminderInfo.message}`,
        planName,
        reminderMessage,
        '/dashboard/partner/billing',
        'partner'
      )
      if (emailSent) results.emails_sent++

      // Envoyer SMS si urgence élevée
      if (reminderInfo.urgency !== 'info' && profile.phone) {
        const smsMessage = `WOUAKA: Votre abonnement ${planName} expire dans ${reminderInfo.message}. Renouvelez sur wouaka-creditscore.com`
        const smsSent = await sendSMS(profile.phone, smsMessage)
        if (smsSent) results.sms_sent++
        
        results.details.push({
          user_id: sub.user_id,
          email: profile.email,
          phone: profile.phone,
          reminder_type: reminderInfo.type,
          plan: planName,
          type: 'partner',
          email_sent: emailSent,
          sms_sent: smsSent
        })
      } else {
        results.details.push({
          user_id: sub.user_id,
          email: profile.email,
          reminder_type: reminderInfo.type,
          plan: planName,
          type: 'partner',
          email_sent: emailSent,
          sms_sent: false
        })
      }

      results.partner_reminders_sent++
    }

    // ================================================
    // PARTIE 3: Rappels pour les certificats emprunteurs (B2C)
    // ================================================
    console.log('[Reminders] Checking borrower certificate subscriptions...')

    const { data: borrowerSubs, error: borrowerError } = await supabase
      .from('certificate_subscriptions')
      .select(`
        id,
        user_id,
        valid_until,
        plan_id,
        status
      `)
      .eq('status', 'active')
      .not('valid_until', 'is', null)

    if (borrowerError) {
      console.error('[Reminders] Error fetching borrower subscriptions:', borrowerError)
      results.errors.push(`Borrower fetch error: ${borrowerError.message}`)
    }

    for (const sub of borrowerSubs || []) {
      if (!sub.valid_until) continue

      const expiryDate = new Date(sub.valid_until)
      const reminderInfo = getReminderInfo(formatDateForComparison(expiryDate))
      if (!reminderInfo) continue

      // Vérifier si rappel déjà envoyé aujourd'hui
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('type', 'certificate_reminder')
        .gte('created_at', formatDateForComparison(now))
        .maybeSingle()

      if (existingNotif) continue

      // Récupérer le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', sub.user_id)
        .single()

      if (!profile) continue

      const planName = BORROWER_PLAN_NAMES[sub.plan_id] || 'Certificat'
      const reminderMessage = `Votre certificat ${planName} expire dans ${reminderInfo.message}. Renouvelez-le pour continuer à partager votre solvabilité avec les institutions.`

      // Créer notification in-app
      await supabase.from('notifications').insert({
        user_id: sub.user_id,
        title: 'Rappel Certificat',
        message: reminderMessage,
        type: 'certificate_reminder',
        action_url: '/dashboard/borrower/score',
        metadata: { 
          reminder_type: reminderInfo.type, 
          expiry_date: sub.valid_until, 
          plan_name: planName,
          certificate_subscription_id: sub.id
        }
      })

      // Envoyer email
      const emailSent = await sendEmail(
        profile.email || '',
        profile.full_name || '',
        `${reminderInfo.urgency === 'critical' ? '⚠️ ' : ''}Votre certificat Wouaka expire dans ${reminderInfo.message}`,
        planName,
        reminderMessage,
        '/dashboard/borrower/score',
        'borrower'
      )
      if (emailSent) results.emails_sent++

      // Envoyer SMS (pour tous les rappels emprunteur car c'est B2C)
      if (profile.phone) {
        const smsMessage = `WOUAKA: Votre certificat ${planName} expire dans ${reminderInfo.message}. Renouvelez sur wouaka-creditscore.com pour maintenir votre score.`
        const smsSent = await sendSMS(profile.phone, smsMessage)
        if (smsSent) results.sms_sent++
        
        results.details.push({
          user_id: sub.user_id,
          email: profile.email,
          phone: profile.phone,
          reminder_type: reminderInfo.type,
          plan: planName,
          type: 'borrower',
          email_sent: emailSent,
          sms_sent: smsSent
        })
      } else {
        results.details.push({
          user_id: sub.user_id,
          email: profile.email,
          reminder_type: reminderInfo.type,
          plan: planName,
          type: 'borrower',
          email_sent: emailSent,
          sms_sent: false
        })
      }

      results.borrower_reminders_sent++
    }

    console.log(`[Reminders] Completed. Trials: ${results.trial_reminders_sent}, Partner: ${results.partner_reminders_sent}, Borrower: ${results.borrower_reminders_sent}, Emails: ${results.emails_sent}, SMS: ${results.sms_sent}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.trial_reminders_sent + results.partner_reminders_sent + results.borrower_reminders_sent} rappels envoyés`,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Reminders] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
