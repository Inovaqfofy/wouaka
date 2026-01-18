// ============================================
// SMS OTP SEND - Sovereign with Fallback Mode
// Primary: AfricasTalking | Fallback: Display code for testing
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  phone_number: string;
  purpose?: 'kyc' | 'login' | 'transaction';
  user_id?: string;
  partner_id?: string;
  allow_fallback?: boolean; // Allow displaying code when SMS service unavailable
}

interface OTPResponse {
  success: boolean;
  message: string;
  phone_masked: string;
  expires_in_seconds: number;
  delivery_method: 'sms' | 'fallback_display';
  fallback_code?: string; // Only populated in fallback mode
  error?: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number for AfricasTalking (must start with +)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  // Handle various UEMOA country codes
  const countryCodes = ['225', '221', '223', '226', '228', '229', '227', '245'];
  
  if (!cleaned.startsWith('+')) {
    // Check if it starts with a country code
    for (const code of countryCodes) {
      if (cleaned.startsWith(code)) {
        cleaned = '+' + cleaned;
        break;
      }
    }
    
    // If still no +, assume Côte d'Ivoire
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('07') || cleaned.startsWith('05') || cleaned.startsWith('01')) {
        cleaned = '+225' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
  }
  
  return cleaned;
}

// Mask phone number for display
function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 6) + '****' + phone.slice(-2);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      phone_number, 
      purpose = 'kyc', 
      user_id, 
      partner_id,
      allow_fallback = true 
    }: OTPRequest = await req.json();

    if (!phone_number) {
      return new Response(
        JSON.stringify({ success: false, error: 'Numéro de téléphone requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone_number);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .upsert({
        phone_number: formattedPhone,
        otp_code: otp,
        purpose,
        user_id,
        partner_id,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number,purpose'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur de stockage OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for AfricasTalking credentials
    const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
    const username = Deno.env.get('AFRICASTALKING_USERNAME');

    // Try to send via AfricasTalking
    if (apiKey && username) {
      const message = `Wouaka: Votre code de vérification est ${otp}. Valide 10 minutes. Ne partagez jamais ce code.`;
      
      const isSandbox = username === 'sandbox';
      const baseUrl = isSandbox 
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('to', formattedPhone);
      formData.append('message', message);
      formData.append('from', 'WOUAKA');

      console.log(`[SMS-OTP] Sending to ${maskPhoneNumber(formattedPhone)} via AfricasTalking (${isSandbox ? 'sandbox' : 'production'})`);

      try {
        const smsResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'apiKey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData.toString()
        });

        const smsResult = await smsResponse.json();
        console.log('[SMS-OTP] AfricasTalking response:', JSON.stringify(smsResult));

        const recipients = smsResult.SMSMessageData?.Recipients || [];
        const firstRecipient = recipients[0];
        
        if (firstRecipient?.status === 'Success' || firstRecipient?.statusCode === 101) {
          // Log success
          await supabase.from('audit_logs').insert({
            action: 'otp_sent',
            entity_type: 'phone_verification',
            entity_id: formattedPhone,
            metadata: {
              purpose,
              partner_id,
              provider: 'africastalking',
              delivery_method: 'sms',
              message_id: firstRecipient.messageId,
              cost: firstRecipient.cost
            }
          });

          const response: OTPResponse = {
            success: true,
            message: 'Code envoyé par SMS',
            phone_masked: maskPhoneNumber(formattedPhone),
            expires_in_seconds: 600,
            delivery_method: 'sms',
          };

          return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // SMS failed - fall through to fallback if allowed
        console.warn('[SMS-OTP] SMS delivery failed:', firstRecipient?.status);
      } catch (smsError) {
        console.error('[SMS-OTP] AfricasTalking error:', smsError);
        // Fall through to fallback
      }
    }

    // Fallback mode - display code directly
    if (allow_fallback) {
      console.log(`[SMS-OTP] Using fallback mode for ${maskPhoneNumber(formattedPhone)}`);
      
      // Log fallback usage
      await supabase.from('audit_logs').insert({
        action: 'otp_sent',
        entity_type: 'phone_verification',
        entity_id: formattedPhone,
        metadata: {
          purpose,
          partner_id,
          provider: 'fallback_display',
          delivery_method: 'fallback_display',
          reason: apiKey ? 'sms_delivery_failed' : 'sms_service_not_configured'
        }
      });

      const response: OTPResponse = {
        success: true,
        message: 'Service SMS non disponible. Code affiché pour test.',
        phone_masked: maskPhoneNumber(formattedPhone),
        expires_in_seconds: 600,
        delivery_method: 'fallback_display',
        fallback_code: otp, // Display code for testing
      };

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No fallback allowed and SMS failed
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Service SMS non disponible. Veuillez réessayer plus tard.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SMS-OTP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
