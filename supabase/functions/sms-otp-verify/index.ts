import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  phone_number: string;
  otp_code: string;
  purpose?: 'kyc' | 'login' | 'transaction';
}

// Format phone number for matching
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  if (cleaned.startsWith('225') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('07') || cleaned.startsWith('05') || cleaned.startsWith('01')) {
    cleaned = '+225' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, otp_code, purpose = 'kyc' }: VerifyRequest = await req.json();

    if (!phone_number || !otp_code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Numéro de téléphone et code OTP requis' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone_number);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('purpose', purpose)
      .eq('verified', false)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun code en attente pour ce numéro' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Code expiré. Demandez un nouveau code.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max attempts (5 attempts max)
    if (otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Trop de tentatives. Demandez un nouveau code.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts
    await supabase
      .from('otp_verifications')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    // Verify OTP
    if (otpRecord.otp_code !== otp_code) {
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as verified
    const verifiedAt = new Date().toISOString();
    await supabase
      .from('otp_verifications')
      .update({ 
        verified: true, 
        verified_at: verifiedAt 
      })
      .eq('id', otpRecord.id);

    // Log verification success
    await supabase.from('audit_logs').insert({
      action: 'otp_verified',
      entity_type: 'phone_verification',
      entity_id: formattedPhone,
      user_id: otpRecord.user_id,
      metadata: {
        purpose,
        partner_id: otpRecord.partner_id,
        attempts_used: otpRecord.attempts + 1
      }
    });

    // Create a verification record for future reference
    const verificationToken = crypto.randomUUID();
    
    await supabase.from('phone_verifications').insert({
      phone_number: formattedPhone,
      verified_at: verifiedAt,
      verification_method: 'sms_otp',
      provider: 'africastalking',
      partner_id: otpRecord.partner_id,
      user_id: otpRecord.user_id,
      purpose,
      verification_token: verificationToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Valid 24h
    });

    // Initialize or update phone_trust_scores for the user
    if (otpRecord.user_id) {
      await supabase.from('phone_trust_scores').upsert({
        user_id: otpRecord.user_id,
        phone_number: formattedPhone,
        otp_verified: true,
        otp_verified_at: verifiedAt,
        trust_score: 30, // Base score for OTP verification
        trust_level: 'basic',
        updated_at: verifiedAt
      }, {
        onConflict: 'user_id'
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Numéro vérifié avec succès',
        verification_token: verificationToken,
        phone_number: formattedPhone,
        verified_at: verifiedAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OTP verify error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
