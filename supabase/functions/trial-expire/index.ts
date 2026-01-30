import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpiredTrialResult {
  user_id: string
  email?: string
  plan_name: string
  action: 'expired' | 'api_revoked' | 'notified'
  success: boolean
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

    console.log('[TrialExpire] Starting expired trial check...')

    const now = new Date()
    const results = {
      trials_expired: 0,
      api_keys_revoked: 0,
      webhooks_triggered: 0,
      emails_sent: 0,
      sms_sent: 0,
      errors: [] as string[],
      details: [] as ExpiredTrialResult[]
    }

    // ================================================
    // Helper: Déclencher les webhooks trial.expired
    // ================================================
    const triggerWebhooks = async (userId: string, payload: any) => {
      let triggered = 0
      try {
        // Récupérer les webhooks de l'utilisateur qui écoutent trial.expired
        const { data: webhooks } = await supabase
          .from('webhooks')
          .select('id, url, secret, events')
          .eq('user_id', userId)
          .eq('is_active', true)

        for (const webhook of webhooks || []) {
          if (!webhook.events?.includes('trial.expired')) continue

          // Créer la signature HMAC
          const encoder = new TextEncoder()
          const payloadStr = JSON.stringify(payload)
          const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(webhook.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          )
          const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr))
          const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

          try {
            const response = await fetch(webhook.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Wouaka-Signature': signatureHex,
                'X-Wouaka-Event': 'trial.expired',
                'X-Wouaka-Timestamp': now.toISOString(),
              },
              body: payloadStr,
            })

            // Logger la livraison
            await supabase.from('webhook_deliveries').insert({
              webhook_id: webhook.id,
              event_type: 'trial.expired',
              payload,
              response_status: response.status,
              response_body: await response.text().catch(() => null),
              delivered_at: new Date().toISOString(),
              success: response.ok
            })

            if (response.ok) {
              triggered++
              await supabase
                .from('webhooks')
                .update({ last_triggered_at: now.toISOString(), failure_count: 0 })
                .eq('id', webhook.id)
            } else {
              await supabase
                .from('webhooks')
                .update({ failure_count: (webhook as any).failure_count + 1 || 1 })
                .eq('id', webhook.id)
            }
          } catch (e) {
            console.error(`[TrialExpire] Webhook delivery failed for ${webhook.id}:`, e)
          }
        }
      } catch (e) {
        console.error('[TrialExpire] Error triggering webhooks:', e)
      }
      return triggered
    }

    // ================================================
    // ÉTAPE 1: Trouver tous les essais expirés
    // ================================================
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_start,
        trial_end,
        trial_expired_notified,
        plan_id
      `)
      .eq('status', 'trialing')
      .lt('trial_end', now.toISOString())

    if (fetchError) {
      console.error('[TrialExpire] Error fetching trials:', fetchError)
      throw fetchError
    }

    console.log(`[TrialExpire] Found ${expiredTrials?.length || 0} expired trials`)

    // Helper: envoyer un SMS via Africa's Talking
    const sendSMS = async (phone: string, message: string) => {
      if (!atUsername || !atApiKey || !phone) return false

      let formattedPhone = phone.replace(/\s/g, '')
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+225' + formattedPhone.substring(1)
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

        if (!response.ok) return false
        return true
      } catch {
        return false
      }
    }

    for (const trial of expiredTrials || []) {
      try {
        // Récupérer le profil utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, phone, company')
          .eq('id', trial.user_id)
          .single()

        // Récupérer le nom du plan
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', trial.plan_id)
          .single()

        const planName = plan?.name || 'Essai Gratuit'
        const userName = profile?.full_name || profile?.company || 'Partenaire'

        // ================================================
        // ÉTAPE 2: Marquer l'abonnement comme expiré
        // ================================================
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            trial_expired_notified: true,
            metadata: {
              expired_at: now.toISOString(),
              reason: 'trial_ended'
            }
          })
          .eq('id', trial.id)

        if (updateError) {
          results.errors.push(`Failed to expire trial ${trial.id}: ${updateError.message}`)
          continue
        }

        results.trials_expired++
        results.details.push({
          user_id: trial.user_id,
          email: profile?.email,
          plan_name: planName,
          action: 'expired',
          success: true
        })

        // ================================================
        // ÉTAPE 3: Révoquer les clés API actives
        // ================================================
        const { data: apiKeys, error: keysError } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', trial.user_id)
          .eq('is_active', true)

        if (!keysError && apiKeys && apiKeys.length > 0) {
          const { error: revokeError } = await supabase
            .from('api_keys')
            .update({
              is_active: false,
              revoked_at: now.toISOString(),
              revoked_reason: 'trial_expired'
            })
            .eq('user_id', trial.user_id)
            .eq('is_active', true)

          if (!revokeError) {
            results.api_keys_revoked += apiKeys.length
            console.log(`[TrialExpire] Revoked ${apiKeys.length} API keys for user ${trial.user_id}`)
          }
        }

        // ================================================
        // ÉTAPE 4: Envoyer notification et email
        // ================================================
        // Créer notification in-app
        await supabase.from('notifications').insert({
          user_id: trial.user_id,
          title: 'Votre essai gratuit est terminé',
          message: `Votre période d'essai de 14 jours est terminée. Pour continuer à utiliser l'API WOUAKA, choisissez un plan payant.`,
          type: 'trial_expired',
          action_url: '/dashboard/partner/billing',
          metadata: {
            plan_name: planName,
            expired_at: now.toISOString()
          }
        })

        // Envoyer email si pas déjà notifié
        if (!trial.trial_expired_notified && resendApiKey && profile?.email) {
          try {
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'Wouaka <noreply@wouaka-creditscore.com>',
                to: [profile.email],
                subject: '⏰ Votre essai gratuit WOUAKA est terminé',
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
                            ⏰ Essai terminé
                          </h1>
                        </div>
                        
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                          Bonjour ${userName},
                        </p>
                        
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                          Votre période d'essai gratuit de <strong>14 jours</strong> est maintenant terminée.
                        </p>

                        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #ef4444;">
                          <p style="margin: 0; color: #dc2626; font-size: 14px;">
                            <strong>Important:</strong> Vos clés API ont été désactivées. Pour continuer à accéder aux dossiers de preuves, veuillez souscrire à un plan payant.
                          </p>
                        </div>

                        <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                          Pendant votre essai, vous avez pu tester l'API WOUAKA. Passez à un plan payant pour :
                        </p>

                        <ul style="color: #52525b; font-size: 14px; line-height: 1.8;">
                          <li>Accéder à des dossiers de preuves illimités selon votre plan</li>
                          <li>Webhooks temps réel</li>
                          <li>Export PDF pour vos comités de crédit</li>
                          <li>Screening AML/PEP inclus</li>
                        </ul>
                        
                        <div style="text-align: center; margin-top: 30px;">
                          <a href="https://www.wouaka-creditscore.com/dashboard/partner/billing" 
                             style="display: inline-block; background-color: #18181b; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                            Choisir mon plan
                          </a>
                        </div>

                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
                            Des questions ? Contactez-nous à <a href="mailto:support@wouaka-creditscore.com" style="color: #18181b;">support@wouaka-creditscore.com</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </body>
                  </html>
                `,
              }),
            })
            
            if (response.ok) {
              results.emails_sent++
              console.log(`[TrialExpire] Email sent to ${profile.email}`)
            } else {
              const error = await response.text()
              console.error('[TrialExpire] Email error:', error)
              results.errors.push(`Email failed for ${trial.user_id}: ${error}`)
            }
          } catch (emailError) {
            console.error('[TrialExpire] Email error:', emailError)
            results.errors.push(`Email failed for ${trial.user_id}: ${(emailError as Error).message}`)
          }
        }

        // Envoyer SMS
        if (profile?.phone) {
          const smsMessage = `WOUAKA: Votre essai gratuit est terminé. Vos clés API ont été désactivées. Choisissez un plan sur wouaka-creditscore.com pour continuer.`
          const smsSent = await sendSMS(profile.phone, smsMessage)
          if (smsSent) {
            results.sms_sent++
          }
        }

        // ================================================
        // ÉTAPE 5: Déclencher les webhooks trial.expired
        // ================================================
        const webhookPayload = {
          event: 'trial.expired',
          timestamp: now.toISOString(),
          data: {
            user_id: trial.user_id,
            subscription_id: trial.id,
            trial_started_at: trial.trial_start,
            trial_ended_at: trial.trial_end,
            expired_at: now.toISOString(),
            api_keys_revoked: apiKeys?.length || 0,
            user: {
              email: profile?.email,
              name: profile?.full_name || profile?.company,
            }
          }
        }
        
        const webhooksTriggered = await triggerWebhooks(trial.user_id, webhookPayload)
        results.webhooks_triggered += webhooksTriggered

        results.details.push({
          user_id: trial.user_id,
          email: profile?.email,
          plan_name: planName,
          action: 'notified',
          success: true
        })

      } catch (error) {
        console.error(`[TrialExpire] Error processing trial ${trial.id}:`, error)
        results.errors.push(`Error for trial ${trial.id}: ${(error as Error).message}`)
      }
    }

    console.log(`[TrialExpire] Completed. Expired: ${results.trials_expired}, Keys revoked: ${results.api_keys_revoked}, Webhooks: ${results.webhooks_triggered}, Emails: ${results.emails_sent}, SMS: ${results.sms_sent}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.trials_expired} essais expirés traités`,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[TrialExpire] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
