// ============================================
// RECERTIFY CERTIFICATE - Enhanced Scoring v2.0
// Uses real proof-based scoring algorithm
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// CONFIDENCE COEFFICIENTS (Sovereign Proof Model)
// ============================================

const HARD_PROOF_COEFFICIENT = 1.0;   // OCR certified, SMS verified, APIs
const SOFT_PROOF_COEFFICIENT = 0.7;   // USSD screenshots, attestations
const DECLARATIVE_COEFFICIENT = 0.3;  // User declared without proof

// ============================================
// FEATURE WEIGHTS (Source of Truth)
// ============================================

interface FeatureWeight {
  basePoints: number;
  maxPoints: number;
  proofType: 'hard' | 'soft' | 'declarative';
  category: 'identity' | 'cashflow' | 'social' | 'behavioral';
}

const SCORING_FEATURES: Record<string, FeatureWeight> = {
  // Hard Proofs (Highest Value)
  identity_document: { basePoints: 20, maxPoints: 25, proofType: 'hard', category: 'identity' },
  phone_otp_verified: { basePoints: 15, maxPoints: 15, proofType: 'hard', category: 'identity' },
  sms_transactions: { basePoints: 15, maxPoints: 20, proofType: 'hard', category: 'cashflow' },
  
  // Soft Proofs (Medium Value)
  ussd_screenshot: { basePoints: 10, maxPoints: 15, proofType: 'soft', category: 'cashflow' },
  address_document: { basePoints: 8, maxPoints: 12, proofType: 'soft', category: 'identity' },
  income_document: { basePoints: 10, maxPoints: 15, proofType: 'soft', category: 'cashflow' },
  guarantor_verified: { basePoints: 8, maxPoints: 12, proofType: 'soft', category: 'social' },
  
  // Declarative (Low Value)
  profile_complete: { basePoints: 5, maxPoints: 5, proofType: 'declarative', category: 'identity' },
  bank_statement_upload: { basePoints: 5, maxPoints: 8, proofType: 'declarative', category: 'cashflow' },
};

// ============================================
// PROOF ANALYSIS FUNCTIONS
// ============================================

interface ProofAnalysis {
  proofType: 'hard' | 'soft' | 'declarative';
  coefficient: number;
  isVerified: boolean;
  confidence: number;
  points: number;
  source: string;
}

function getCoefficient(proofType: 'hard' | 'soft' | 'declarative'): number {
  switch (proofType) {
    case 'hard': return HARD_PROOF_COEFFICIENT;
    case 'soft': return SOFT_PROOF_COEFFICIENT;
    case 'declarative': return DECLARATIVE_COEFFICIENT;
  }
}

function analyzeDocumentProof(doc: {
  document_type: string;
  status: string;
  ocr_confidence: number | null;
  ocr_data: Record<string, unknown> | null;
}): ProofAnalysis {
  const docType = doc.document_type?.toLowerCase() || 'other';
  
  // Determine if it's a hard proof (verified with OCR)
  const isVerified = doc.status === 'verified' || (doc.ocr_confidence && doc.ocr_confidence >= 50);
  const hasOcrData = doc.ocr_data !== null;
  
  let proofType: 'hard' | 'soft' | 'declarative' = 'declarative';
  let confidence = 30;
  let points = 0;
  let source = 'upload';
  
  // Determine proof type based on verification level
  if (isVerified && hasOcrData && doc.ocr_confidence && doc.ocr_confidence >= 70) {
    proofType = 'hard';
    confidence = Math.min(100, doc.ocr_confidence);
    source = 'ocr_verified';
  } else if (isVerified || (doc.ocr_confidence && doc.ocr_confidence >= 50)) {
    proofType = 'soft';
    confidence = doc.ocr_confidence || 60;
    source = 'partially_verified';
  } else if (hasOcrData) {
    proofType = 'soft';
    confidence = 40;
    source = 'ocr_attempt';
  }
  
  // Calculate points based on document type
  const featureKey = docType.includes('identity') || docType.includes('national') || docType.includes('passport')
    ? 'identity_document'
    : docType.includes('address')
      ? 'address_document'
      : docType.includes('income') || docType.includes('bank')
        ? 'income_document'
        : 'bank_statement_upload';
  
  const feature = SCORING_FEATURES[featureKey] || SCORING_FEATURES.bank_statement_upload;
  const coefficient = getCoefficient(proofType);
  
  // Points = base * coefficient * (confidence / 100)
  points = Math.round(feature.basePoints * coefficient * (confidence / 100));
  
  return {
    proofType,
    coefficient,
    isVerified: !!isVerified,
    confidence,
    points,
    source,
  };
}

function analyzePhoneTrustProof(phoneTrust: {
  trust_score: number;
  otp_verified: boolean;
  ussd_uploaded?: boolean;
  identity_cross_validated?: boolean;
  sms_consent_given?: boolean;
} | null): { otp: ProofAnalysis; sms: ProofAnalysis; ussd: ProofAnalysis } {
  const baseOtp: ProofAnalysis = {
    proofType: 'declarative',
    coefficient: DECLARATIVE_COEFFICIENT,
    isVerified: false,
    confidence: 0,
    points: 0,
    source: 'none',
  };
  
  const baseSms: ProofAnalysis = { ...baseOtp };
  const baseUssd: ProofAnalysis = { ...baseOtp };
  
  if (!phoneTrust) {
    return { otp: baseOtp, sms: baseSms, ussd: baseUssd };
  }
  
  // OTP Verification (Hard Proof)
  if (phoneTrust.otp_verified) {
    const feature = SCORING_FEATURES.phone_otp_verified;
    baseOtp.proofType = 'hard';
    baseOtp.coefficient = HARD_PROOF_COEFFICIENT;
    baseOtp.isVerified = true;
    baseOtp.confidence = 100;
    baseOtp.points = feature.basePoints;
    baseOtp.source = 'otp_sms';
  }
  
  // SMS Consent + Analysis (Hard Proof if consented)
  if (phoneTrust.sms_consent_given) {
    const feature = SCORING_FEATURES.sms_transactions;
    baseSms.proofType = 'hard';
    baseSms.coefficient = HARD_PROOF_COEFFICIENT;
    baseSms.isVerified = true;
    baseSms.confidence = 90;
    baseSms.points = feature.basePoints;
    baseSms.source = 'sms_analysis';
  }
  
  // USSD Screenshot (Soft Proof)
  if (phoneTrust.ussd_uploaded) {
    const feature = SCORING_FEATURES.ussd_screenshot;
    baseUssd.proofType = 'soft';
    baseUssd.coefficient = SOFT_PROOF_COEFFICIENT;
    baseUssd.isVerified = true;
    baseUssd.confidence = 75;
    baseUssd.points = Math.round(feature.basePoints * SOFT_PROOF_COEFFICIENT);
    baseUssd.source = 'ussd_screenshot';
  }
  
  return { otp: baseOtp, sms: baseSms, ussd: baseUssd };
}

// ============================================
// CERTAINTY COEFFICIENT CALCULATION
// ============================================

function calculateCertaintyCoefficient(proofs: ProofAnalysis[]): number {
  const validProofs = proofs.filter(p => p.points > 0);
  if (validProofs.length === 0) return 0.30; // Minimum base
  
  const hardProofs = validProofs.filter(p => p.proofType === 'hard');
  const softProofs = validProofs.filter(p => p.proofType === 'soft');
  const declarativeProofs = validProofs.filter(p => p.proofType === 'declarative');
  
  const totalProofs = validProofs.length;
  
  // Weighted coefficient based on proof distribution
  const hardWeight = (hardProofs.length / totalProofs) * HARD_PROOF_COEFFICIENT;
  const softWeight = (softProofs.length / totalProofs) * SOFT_PROOF_COEFFICIENT;
  const declWeight = (declarativeProofs.length / totalProofs) * DECLARATIVE_COEFFICIENT;
  
  let coefficient = hardWeight + softWeight + declWeight;
  
  // Bonus for complete verification chain
  const hasIdentity = validProofs.some(p => p.source.includes('ocr') || p.source.includes('identity'));
  const hasPhone = validProofs.some(p => p.source === 'otp_sms');
  const hasCashflow = validProofs.some(p => p.source.includes('sms') || p.source.includes('ussd'));
  
  if (hasIdentity && hasPhone && hasCashflow) {
    coefficient = Math.min(1, coefficient + 0.15); // Full verification bonus
  } else if (hasIdentity && hasPhone) {
    coefficient = Math.min(1, coefficient + 0.10);
  } else if (hasIdentity) {
    coefficient = Math.min(1, coefficient + 0.05);
  }
  
  return Math.max(0.30, Math.min(1, coefficient));
}

// ============================================
// TRUST LEVEL DETERMINATION
// ============================================

function determineTrustLevel(certaintyCoefficient: number, score: number): string {
  // Trust level depends on BOTH coefficient AND score
  if (certaintyCoefficient >= 0.85 && score >= 70) return 'certified';
  if (certaintyCoefficient >= 0.70 && score >= 60) return 'strong';
  if (certaintyCoefficient >= 0.50 && score >= 45) return 'verified';
  if (certaintyCoefficient >= 0.30) return 'basic';
  return 'insufficient';
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Non authentifié");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Utilisateur non trouvé");
    }

    const body = await req.json().catch(() => ({}));

    // Verify active subscription
    const { data: subscription, error: subError } = await supabase
      .from("certificate_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("valid_until", new Date().toISOString())
      .order("valid_until", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      throw new Error("Aucun abonnement actif trouvé. Veuillez souscrire à un plan.");
    }

    // Check recertifications available
    const canRecertify = subscription.recertifications_total === null || 
      (subscription.recertifications_total - subscription.recertifications_used) > 0;

    if (!canRecertify) {
      throw new Error("Vous n'avez plus de recertifications disponibles sur votre abonnement actuel.");
    }

    // Get current certificate for linking
    const { data: currentCert } = await supabase
      .from("certificates")
      .select("id, recertification_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // ============================================
    // GATHER ALL PROOF DATA
    // ============================================

    console.log("[Recertify v2] Starting proof analysis for user:", user.id);

    // 1. Get KYC Documents
    const { data: kycDocs } = await supabase
      .from('kyc_documents')
      .select('document_type, status, ocr_confidence, ocr_data')
      .eq('user_id', user.id);

    // 2. Get Phone Trust Score
    const { data: phoneTrust } = await supabase
      .from("phone_trust_scores")
      .select("trust_score, otp_verified, ussd_uploaded, identity_cross_validated, sms_consent_given")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    // 3. Get USSD Validations
    const { data: ussdValidations } = await supabase
      .from('ussd_screenshot_validations')
      .select('id, validation_status')
      .eq('user_id', user.id)
      .eq('validation_status', 'validated');

    // 4. Count SMS Analyses
    const { count: smsCount } = await supabase
      .from('sms_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 5. Get Verified Guarantors
    const { data: guarantors } = await supabase
      .from('user_guarantors')
      .select('id, quality_score')
      .eq('user_id', user.id)
      .eq('identity_verified', true);

    // 6. Get User Profile for completeness check
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, company')
      .eq('id', user.id)
      .single();

    // ============================================
    // ANALYZE PROOFS
    // ============================================

    const allProofs: ProofAnalysis[] = [];
    const proofDetails: Record<string, unknown> = {};

    // Analyze documents
    const documentAnalysis: Record<string, ProofAnalysis> = {};
    if (kycDocs && kycDocs.length > 0) {
      for (const doc of kycDocs) {
        const analysis = analyzeDocumentProof(doc);
        const key = doc.document_type || 'other';
        
        // Only count best version of each document type
        if (!documentAnalysis[key] || documentAnalysis[key].points < analysis.points) {
          documentAnalysis[key] = analysis;
        }
      }
      
      Object.values(documentAnalysis).forEach(a => allProofs.push(a));
      proofDetails.documents = documentAnalysis;
    }

    // Analyze phone trust
    const phoneAnalysis = analyzePhoneTrustProof(phoneTrust || null);
    if (phoneAnalysis.otp.points > 0) allProofs.push(phoneAnalysis.otp);
    if (phoneAnalysis.sms.points > 0) allProofs.push(phoneAnalysis.sms);
    if (phoneAnalysis.ussd.points > 0) allProofs.push(phoneAnalysis.ussd);
    proofDetails.phone = phoneAnalysis;

    // Analyze USSD from validations table (if not from phone_trust)
    if (ussdValidations && ussdValidations.length > 0 && phoneAnalysis.ussd.points === 0) {
      const ussdProof: ProofAnalysis = {
        proofType: 'soft',
        coefficient: SOFT_PROOF_COEFFICIENT,
        isVerified: true,
        confidence: 75,
        points: Math.round(SCORING_FEATURES.ussd_screenshot.basePoints * SOFT_PROOF_COEFFICIENT),
        source: 'ussd_validation_table',
      };
      allProofs.push(ussdProof);
      proofDetails.ussd_extra = ussdProof;
    }

    // Analyze SMS from count (if not from phone_trust)
    if (smsCount && smsCount > 0 && phoneAnalysis.sms.points === 0) {
      const smsBonus = Math.min(5, Math.floor(smsCount / 10)); // Extra 1 point per 10 SMS analyzed
      const smsProof: ProofAnalysis = {
        proofType: 'hard',
        coefficient: HARD_PROOF_COEFFICIENT,
        isVerified: true,
        confidence: 85,
        points: SCORING_FEATURES.sms_transactions.basePoints + smsBonus,
        source: 'sms_analysis_table',
      };
      allProofs.push(smsProof);
      proofDetails.sms_extra = smsProof;
    }

    // Analyze guarantors
    if (guarantors && guarantors.length > 0) {
      const avgQuality = guarantors.reduce((sum, g) => sum + (g.quality_score || 50), 0) / guarantors.length;
      const guarantorProof: ProofAnalysis = {
        proofType: 'soft',
        coefficient: SOFT_PROOF_COEFFICIENT,
        isVerified: true,
        confidence: Math.min(90, avgQuality),
        points: Math.round(SCORING_FEATURES.guarantor_verified.basePoints * SOFT_PROOF_COEFFICIENT),
        source: 'verified_guarantor',
      };
      allProofs.push(guarantorProof);
      proofDetails.guarantors = { count: guarantors.length, avgQuality, proof: guarantorProof };
    }

    // Profile completeness (declarative)
    if (profile && profile.full_name && profile.phone) {
      const profileProof: ProofAnalysis = {
        proofType: 'declarative',
        coefficient: DECLARATIVE_COEFFICIENT,
        isVerified: true,
        confidence: 50,
        points: Math.round(SCORING_FEATURES.profile_complete.basePoints * DECLARATIVE_COEFFICIENT),
        source: 'profile_data',
      };
      allProofs.push(profileProof);
      proofDetails.profile = profileProof;
    }

    // ============================================
    // CALCULATE FINAL SCORE
    // ============================================

    const baseScore = 30; // Everyone starts with 30
    const proofPoints = allProofs.reduce((sum, p) => sum + p.points, 0);
    const rawScore = baseScore + proofPoints;
    const finalScore = Math.min(100, rawScore);

    // Calculate certainty coefficient
    const certaintyCoefficient = calculateCertaintyCoefficient(allProofs);

    // Determine trust level
    const trustLevel = determineTrustLevel(certaintyCoefficient, finalScore);

    // Generate share code
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    console.log("[Recertify v2] Score calculation:", {
      baseScore,
      proofPoints,
      rawScore,
      finalScore,
      certaintyCoefficient,
      trustLevel,
      proofsCount: allProofs.length,
      hardProofs: allProofs.filter(p => p.proofType === 'hard').length,
      softProofs: allProofs.filter(p => p.proofType === 'soft').length,
      declarativeProofs: allProofs.filter(p => p.proofType === 'declarative').length,
    });

    // ============================================
    // CREATE CERTIFICATE
    // ============================================

    const proofsSnapshot = {
      analyzed_at: new Date().toISOString(),
      version: '2.0',
      proofs: allProofs.map(p => ({
        source: p.source,
        type: p.proofType,
        points: p.points,
        confidence: p.confidence,
      })),
      breakdown: {
        hard: allProofs.filter(p => p.proofType === 'hard').reduce((s, p) => s + p.points, 0),
        soft: allProofs.filter(p => p.proofType === 'soft').reduce((s, p) => s + p.points, 0),
        declarative: allProofs.filter(p => p.proofType === 'declarative').reduce((s, p) => s + p.points, 0),
      },
      details: proofDetails,
    };

    const { data: newCertificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        plan_id: subscription.plan_id,
        score: finalScore,
        certainty_coefficient: certaintyCoefficient,
        trust_level: trustLevel,
        proofs_snapshot: proofsSnapshot,
        valid_from: new Date().toISOString(),
        valid_until: subscription.valid_until,
        recertification_of: currentCert?.id || null,
        recertification_number: (currentCert?.recertification_number || 0) + 1,
        smile_id_level: subscription.smile_id_level,
        share_code: shareCode
      })
      .select()
      .single();

    if (certError) {
      console.error("[Recertify v2] Certificate creation error:", certError);
      throw new Error("Erreur lors de la création du certificat");
    }

    // Update subscription
    if (subscription.recertifications_total !== null) {
      await supabase
        .from("certificate_subscriptions")
        .update({
          recertifications_used: subscription.recertifications_used + 1,
          current_certificate_id: newCertificate.id
        })
        .eq("id", subscription.id);
    } else {
      await supabase
        .from("certificate_subscriptions")
        .update({ current_certificate_id: newCertificate.id })
        .eq("id", subscription.id);
    }

    // Notify user
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Recertification réussie",
      message: `Score: ${finalScore}/100 | Certitude: ${Math.round(certaintyCoefficient * 100)}% | Code: ${shareCode}`,
      type: "success",
      action_url: "/dashboard/borrower/score"
    });

    console.log("[Recertify v2] Certificate created:", newCertificate.id);

    const recertificationsRemaining = subscription.recertifications_total === null 
      ? -1 
      : subscription.recertifications_total - subscription.recertifications_used - 1;

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          id: newCertificate.id,
          score: newCertificate.score,
          certainty_coefficient: newCertificate.certainty_coefficient,
          trust_level: newCertificate.trust_level,
          valid_until: newCertificate.valid_until,
          share_code: newCertificate.share_code,
          recertification_number: newCertificate.recertification_number
        },
        proof_analysis: {
          total_proofs: allProofs.length,
          hard_proofs: allProofs.filter(p => p.proofType === 'hard').length,
          soft_proofs: allProofs.filter(p => p.proofType === 'soft').length,
          declarative_proofs: allProofs.filter(p => p.proofType === 'declarative').length,
        },
        recertifications_remaining: recertificationsRemaining
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Recertify v2] Error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
