import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitRequest {
  verificationType: 'smile_id_basic' | 'smile_id_enhanced' | 'smile_id_biometric';
  customerProfileId?: string;
  identityData: {
    fullName: string;
    nationalId: string;
    phoneNumber: string;
    dateOfBirth?: string;
    country?: string;
  };
  returnUrl: string;
}

// Price configuration in FCFA
const VERIFICATION_PRICES = {
  smile_id_basic: 750,
  smile_id_enhanced: 1000,
  smile_id_biometric: 1500,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cinetpayApiKey = Deno.env.get('CINETPAY_API_KEY');
    const cinetpaySiteId = Deno.env.get('CINETPAY_SITE_ID');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: InitRequest = await req.json();
    const { verificationType, customerProfileId, identityData, returnUrl } = body;

    // Validate verification type
    if (!VERIFICATION_PRICES[verificationType]) {
      return new Response(
        JSON.stringify({ error: 'Type de vérification invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = VERIFICATION_PRICES[verificationType];
    const transactionId = `SMILE-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log(`[smile-id-init] Creating premium verification for user ${user.id}, type: ${verificationType}, amount: ${amount}`);

    // Create premium verification record
    const { data: verification, error: insertError } = await supabase
      .from('premium_verifications')
      .insert({
        user_id: user.id,
        partner_id: user.id,
        customer_profile_id: customerProfileId || null,
        verification_type: verificationType,
        amount,
        currency: 'XOF',
        payment_status: 'pending',
        verification_status: 'pending',
        identity_data: identityData,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[smile-id-init] Error creating verification:', insertError);
      throw insertError;
    }

    console.log(`[smile-id-init] Created verification record: ${verification.id}`);

    // Check if CinetPay is configured
    if (!cinetpayApiKey || !cinetpaySiteId) {
      console.warn('[smile-id-init] CinetPay not configured, returning mock payment URL');
      
      return new Response(
        JSON.stringify({
          success: true,
          verificationId: verification.id,
          paymentUrl: `${returnUrl}?verification_id=${verification.id}&mock=true`,
          message: 'CinetPay non configuré - Mode test',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize CinetPay payment
    const notifyUrl = `${supabaseUrl}/functions/v1/cinetpay-webhook`;
    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: cinetpaySiteId,
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      description: `Vérification Smile ID - ${verificationType}`,
      return_url: `${returnUrl}?verification_id=${verification.id}`,
      notify_url: notifyUrl,
      customer_name: identityData.fullName,
      customer_phone_number: identityData.phoneNumber,
      channels: 'ALL',
      metadata: JSON.stringify({
        type: 'smile_id_verification',
        verification_id: verification.id,
        verification_type: verificationType,
        user_id: user.id,
      }),
    };

    console.log('[smile-id-init] Calling CinetPay API...');

    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cinetpayPayload),
    });

    const cinetpayData = await cinetpayResponse.json();
    console.log('[smile-id-init] CinetPay response:', cinetpayData);

    if (cinetpayData.code !== '201') {
      throw new Error(cinetpayData.message || 'Erreur CinetPay');
    }

    // Update verification with payment info
    await supabase
      .from('premium_verifications')
      .update({
        payment_transaction_id: transactionId,
      })
      .eq('id', verification.id);

    // Store payment transaction
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        amount,
        currency: 'XOF',
        status: 'pending',
        payment_url: cinetpayData.data.payment_url,
        payment_token: cinetpayData.data.payment_token,
        metadata: {
          type: 'smile_id_verification',
          verification_id: verification.id,
          verification_type: verificationType,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        verificationId: verification.id,
        transactionId,
        paymentUrl: cinetpayData.data.payment_url,
        paymentToken: cinetpayData.data.payment_token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[smile-id-init] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
