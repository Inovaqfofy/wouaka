import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  verificationId: string;
}

// Smile ID API endpoints
const SMILE_ID_API_URL = 'https://api.smileidentity.com/v1';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smileIdApiKey = Deno.env.get('SMILE_ID_API_KEY');
    const smileIdPartnerId = Deno.env.get('SMILE_ID_PARTNER_ID');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyRequest = await req.json();
    const { verificationId } = body;

    console.log(`[smile-id-verify] Starting verification for: ${verificationId}`);

    // Get verification record
    const { data: verification, error: fetchError } = await supabase
      .from('premium_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (fetchError || !verification) {
      console.error('[smile-id-verify] Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Vérification non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payment status
    if (verification.payment_status !== 'paid') {
      console.error('[smile-id-verify] Payment not completed');
      return new Response(
        JSON.stringify({ error: 'Paiement non confirmé' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('premium_verifications')
      .update({ verification_status: 'processing' })
      .eq('id', verificationId);

    const identityData = verification.identity_data as {
      fullName: string;
      nationalId: string;
      phoneNumber: string;
      dateOfBirth?: string;
      country?: string;
    };

    // Check if Smile ID is configured
    if (!smileIdApiKey || !smileIdPartnerId) {
      console.warn('[smile-id-verify] Smile ID not configured, using simulation');
      
      // Simulate verification result
      const simulatedResult = simulateVerification(
        verification.verification_type,
        identityData
      );

      await supabase
        .from('premium_verifications')
        .update({
          verification_status: simulatedResult.success ? 'completed' : 'failed',
          verification_result: simulatedResult,
          completed_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      // Trigger webhook if configured
      await triggerPartnerWebhook(supabase, verification, simulatedResult);

      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          result: simulatedResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Smile ID API
    console.log('[smile-id-verify] Calling Smile ID API...');

    const jobType = getJobType(verification.verification_type);
    const smileIdPayload = {
      partner_id: smileIdPartnerId,
      timestamp: new Date().toISOString(),
      source_sdk: 'wouaka',
      source_sdk_version: '1.0.0',
      job_type: jobType,
      user_id: verification.user_id || verification.partner_id,
      job_id: verificationId,
      country: identityData.country || 'CI', // Default to Côte d'Ivoire
      id_type: 'NATIONAL_ID',
      id_number: identityData.nationalId,
      first_name: identityData.fullName.split(' ')[0],
      last_name: identityData.fullName.split(' ').slice(1).join(' '),
      phone_number: identityData.phoneNumber,
      dob: identityData.dateOfBirth,
    };

    const smileIdResponse = await fetch(`${SMILE_ID_API_URL}/id_verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smileIdApiKey}`,
      },
      body: JSON.stringify(smileIdPayload),
    });

    const smileIdResult = await smileIdResponse.json();
    console.log('[smile-id-verify] Smile ID response:', smileIdResult);

    const isSuccess = smileIdResult.result?.ResultCode === '0010' || 
                      smileIdResult.result?.Actions?.Verify_ID_Number === 'Verified';

    const verificationResult = {
      success: isSuccess,
      smileJobId: smileIdResult.job_id,
      resultCode: smileIdResult.result?.ResultCode,
      resultText: smileIdResult.result?.ResultText,
      actions: smileIdResult.result?.Actions,
      returnedInfo: smileIdResult.result?.Return_Info,
      confidence: smileIdResult.result?.Confidence,
      processingTime: Date.now() - startTime,
    };

    // Update verification record
    await supabase
      .from('premium_verifications')
      .update({
        verification_status: isSuccess ? 'completed' : 'failed',
        smile_job_id: smileIdResult.job_id,
        verification_result: verificationResult,
        completed_at: new Date().toISOString(),
        error_message: isSuccess ? null : smileIdResult.result?.ResultText,
      })
      .eq('id', verificationId);

    // Trigger webhook
    await triggerPartnerWebhook(supabase, verification, verificationResult);

    return new Response(
      JSON.stringify({
        success: true,
        result: verificationResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[smile-id-verify] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getJobType(verificationType: string): number {
  switch (verificationType) {
    case 'smile_id_basic':
      return 5; // ID Verification
    case 'smile_id_enhanced':
      return 5; // ID Verification with return data
    case 'smile_id_biometric':
      return 1; // Biometric Verification
    default:
      return 5;
  }
}

function simulateVerification(verificationType: string, identityData: any) {
  // Simulate based on verification type
  const isValidFormat = /^[A-Z]{2}\d{6,12}$/i.test(identityData.nationalId) ||
                        /^\d{10,13}$/.test(identityData.nationalId);
  
  const confidence = isValidFormat ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.3;
  const success = confidence > 0.7;

  const result: any = {
    success,
    simulated: true,
    confidence,
    resultCode: success ? '0010' : '0810',
    resultText: success ? 'Vérification réussie' : 'Vérification échouée',
    processingTime: 1500 + Math.random() * 2000,
    actions: {
      Verify_ID_Number: success ? 'Verified' : 'Not Verified',
      Return_Personal_Info: verificationType !== 'smile_id_basic' ? 'Returned' : 'Not Returned',
    },
  };

  // Add returned info for enhanced and biometric
  if (verificationType !== 'smile_id_basic' && success) {
    result.returnedInfo = {
      full_name: identityData.fullName,
      dob: identityData.dateOfBirth || '1990-01-01',
      gender: 'M',
      address: 'Abidjan, Côte d\'Ivoire',
      photo_base64: null, // Would contain actual photo in real API
      expiry_date: '2030-12-31',
    };
  }

  // Add biometric score for biometric verification
  if (verificationType === 'smile_id_biometric' && success) {
    result.biometricMatch = {
      score: 0.92 + Math.random() * 0.08,
      passed: true,
      antiSpoofingPassed: true,
    };
  }

  return result;
}

async function triggerPartnerWebhook(supabase: any, verification: any, result: any) {
  try {
    // Get partner webhooks
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', verification.partner_id)
      .eq('is_active', true)
      .contains('events', ['kyc.verified', 'verification.completed']);

    if (!webhooks?.length) return;

    const event = {
      type: result.success ? 'verification.completed' : 'verification.failed',
      timestamp: new Date().toISOString(),
      data: {
        verificationId: verification.id,
        verificationType: verification.verification_type,
        customerProfileId: verification.customer_profile_id,
        result,
      },
    };

    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
          },
          body: JSON.stringify(event),
        });
        console.log(`[smile-id-verify] Webhook sent to ${webhook.url}`);
      } catch (err) {
        console.error(`[smile-id-verify] Webhook failed for ${webhook.url}:`, err);
      }
    }
  } catch (err) {
    console.error('[smile-id-verify] Error triggering webhooks:', err);
  }
}
