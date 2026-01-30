import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { EvaluationData } from "@/components/enterprise/NewEvaluationWizard";

export interface EvaluationResult {
  success: boolean;
  product: string;
  clientProfileId?: string;
  scoringRequestId?: string;
  kycRequestId?: string;
  score?: number;
  grade?: string;
  kycStatus?: string;
  riskLevel?: string;
  error?: string;
}

// Helper to create or get customer profile
async function ensureCustomerProfile(
  partnerId: string,
  data: EvaluationData
): Promise<string> {
  // Check if profile already exists with this reference
  const { data: existing } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('external_reference', data.externalReference)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('customer_profiles')
    .insert({
      partner_id: partnerId,
      external_reference: data.externalReference,
      identity_data: {
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        national_id: data.nationalId,
        date_of_birth: data.dateOfBirth,
        city: data.city,
        country: data.country,
      },
      financial_indicators: {
        monthly_income: data.monthlyIncome,
        monthly_expenses: data.monthlyExpenses,
        existing_loans: data.existingLoans,
        employment_type: data.employmentType,
        company_name: data.companyName,
      },
      telecom_indicators: {
        sim_age_months: data.simAgeMonths,
      },
      commercial_indicators: {
        rccm_number: data.rccmNumber,
        years_in_business: data.yearsInBusiness,
        sector: data.sector,
      },
    })
    .select('id')
    .single();

  if (error) throw error;
  return newProfile.id;
}

// W-KYC Evaluation with full verification data
async function runKycEvaluation(
  partnerId: string,
  customerProfileId: string,
  data: EvaluationData
): Promise<{ 
  kycRequestId: string; 
  status: string; 
  riskLevel: string; 
  identityScore: number;
  verificationsPerformed: any[];
  fraudIndicators: any[];
}> {
  // Call W-KYC edge function with all data
  const { data: kycResult, error } = await supabase.functions.invoke('wouaka-kyc', {
    body: {
      level: data.kycLevel || 'basic',
      national_id: data.nationalId || `TEMP-${Date.now()}`,
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth || '1990-01-01',
      phone_number: data.phoneNumber,
      country: data.country || 'CI',
      // Document data from OCR
      document_type: data.documents?.find(d => d.type.includes('identity'))?.type,
      documents_provided: data.documents?.length || 0,
      ocr_data: data.documents?.reduce((acc, doc) => {
        if (doc.ocrData?.extractedFields) {
          return { ...acc, ...doc.ocrData.extractedFields };
        }
        return acc;
      }, {}),
      ocr_confidence: data.documents?.reduce((sum, doc) => 
        sum + (doc.ocrData?.confidence || 0), 0) / (data.documents?.length || 1),
      // Device info
      device_info: {
        device_type: 'web',
        os: navigator.userAgent,
      },
    }
  });

  if (error) throw error;

  // Build verifications list from checks
  const verificationsPerformed = Object.entries(kycResult?.checks || {}).map(([key, check]: [string, any]) => ({
    check: key,
    passed: check.passed,
    message: check.message,
    confidence: check.confidence,
  }));

  // Save KYC request to database with all details
  const { data: kycRequest, error: insertError } = await supabase
    .from('kyc_requests')
    .insert({
      partner_id: partnerId,
      customer_profile_id: customerProfileId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      national_id: data.nationalId,
      status: kycResult?.status === 'verified' ? 'verified' : 
              kycResult?.status === 'rejected' ? 'rejected' : 
              kycResult?.manual_review_required ? 'review' : 'pending',
      identity_score: kycResult?.risk_score ? Math.round(100 - kycResult.risk_score) : 50,
      fraud_score: kycResult?.fraud_indicators?.filter((i: any) => i.detected).length * 20 || 0,
      risk_level: kycResult?.risk_level || 'medium',
      risk_flags: kycResult?.risk_factors?.map((f: any) => f.factor) || [],
      processing_time_ms: kycResult?.processing_time_ms,
      documents_submitted: data.documents?.length || 0,
      documents_verified: data.documents?.filter(d => d.status === 'verified').length || 0,
      kyc_level: data.kycLevel || 'basic',
      documents_required: data.kycLevel === 'basic' ? ['identity_card'] : 
                          data.kycLevel === 'enhanced' ? ['identity_card', 'selfie'] :
                          ['identity_card', 'selfie', 'proof_of_address'],
      verifications_performed: verificationsPerformed,
      fraud_indicators: kycResult?.fraud_indicators || [],
      rejection_reason: kycResult?.rejection_reason,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  return {
    kycRequestId: kycRequest.id,
    status: kycResult?.status || 'pending',
    riskLevel: kycResult?.risk_level || 'medium',
    identityScore: kycResult?.risk_score ? Math.round(100 - kycResult.risk_score) : 50,
    verificationsPerformed,
    fraudIndicators: kycResult?.fraud_indicators || [],
  };
}

// W-SCORE Evaluation with full data
async function runScoreEvaluation(
  partnerId: string,
  customerProfileId: string,
  data: EvaluationData,
  kycScore?: number
): Promise<{ 
  scoringRequestId: string; 
  score: number; 
  grade: string; 
  riskCategory: string;
  subScores: any;
  positiveFactors: any[];
  negativeFactors: any[];
  improvementSuggestions: any[];
  creditRecommendation: any;
}> {
  // Call W-SCORE edge function with all financial data
  const { data: scoreResult, error } = await supabase.functions.invoke('wouaka-score', {
    body: {
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      national_id: data.nationalId,
      // Financial data
      monthly_income: data.monthlyIncome,
      monthly_expenses: data.monthlyExpenses,
      existing_loans: data.existingLoans,
      employment_type: data.employmentType === 'salaried' ? 'formal' :
                       data.employmentType === 'self-employed' ? 'self_employed' :
                       data.employmentType === 'business-owner' ? 'self_employed' :
                       data.employmentType === 'informal' ? 'informal' : 'informal',
      years_in_business: data.yearsInBusiness,
      sector: data.sector,
      // Mobile Money
      momo_total_in: data.momoTotalIn,
      momo_total_out: data.momoTotalOut,
      momo_transaction_count: data.momoTransactionCount,
      momo_period_days: data.momoPeriodDays || 30,
      // Utility
      utility_payments_on_time: data.utilityPaymentsOnTime,
      utility_payments_late: data.utilityPaymentsLate,
      // Social
      tontine_participation: data.tontineParticipation,
      tontine_discipline_rate: data.tontineDisciplineRate,
      cooperative_member: data.cooperativeMember,
      guarantor_count: data.guarantorCount,
      // Telecom
      sim_age_months: data.simAgeMonths,
      // Business
      rccm_number: data.rccmNumber,
      // Location
      city: data.city,
      region: data.city,
      // KYC score if available
      kyc_score: kycScore,
    }
  });

  if (error) throw error;

  // Extract explainability data
  const positiveFactors = scoreResult?.explainability?.positive_factors || [];
  const negativeFactors = scoreResult?.explainability?.negative_factors || [];
  const improvementSuggestions = scoreResult?.explainability?.improvement_suggestions || [];

  // Save scoring request to database with all details
  const { data: scoringRequest, error: insertError } = await supabase
    .from('scoring_requests')
    .insert({
      user_id: partnerId,
      customer_profile_id: customerProfileId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      national_id: data.nationalId,
      company_name: data.companyName,
      monthly_income: data.monthlyIncome,
      employment_type: data.employmentType,
      city: data.city,
      region: data.city,
      score: scoreResult?.final_score || 0,
      grade: scoreResult?.grade || 'C',
      risk_category: scoreResult?.risk_tier || 'standard',
      confidence: scoreResult?.confidence,
      status: 'completed',
      processing_time_ms: scoreResult?.processing_time_ms,
      explanations: scoreResult?.explainability,
      recommendations: scoreResult?.credit_recommendation,
      // New detailed fields
      sub_scores: scoreResult?.sub_scores || {},
      fraud_analysis: scoreResult?.fraud_analysis || {},
      data_quality: scoreResult?.data_quality || 'low',
      positive_factors: positiveFactors,
      negative_factors: negativeFactors,
      improvement_suggestions: improvementSuggestions,
      credit_recommendation: scoreResult?.credit_recommendation || {},
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  // Update customer profile with scores
  await supabase
    .from('customer_profiles')
    .update({
      composite_score: scoreResult?.final_score,
      reliability_score: scoreResult?.sub_scores?.identity_stability?.score,
      stability_score: scoreResult?.sub_scores?.financial_discipline?.score,
      engagement_capacity: scoreResult?.sub_scores?.social_capital?.score,
      risk_score: scoreResult?.risk_tier === 'high_risk' || scoreResult?.risk_tier === 'decline' ? 80 : 
                  scoreResult?.risk_tier === 'subprime' ? 60 :
                  scoreResult?.risk_tier === 'standard' ? 40 : 20,
      last_enriched_at: new Date().toISOString(),
    })
    .eq('id', customerProfileId);

  return {
    scoringRequestId: scoringRequest.id,
    score: scoreResult?.final_score || 0,
    grade: scoreResult?.grade || 'C',
    riskCategory: scoreResult?.risk_tier || 'standard',
    subScores: scoreResult?.sub_scores || {},
    positiveFactors,
    negativeFactors,
    improvementSuggestions,
    creditRecommendation: scoreResult?.credit_recommendation || {},
  };
}

// WOUAKA CORE Evaluation (KYC + Score combined)
async function runCoreEvaluation(
  partnerId: string,
  customerProfileId: string,
  data: EvaluationData
): Promise<{ 
  scoringRequestId: string; 
  kycRequestId: string;
  score: number; 
  grade: string; 
  kycStatus: string;
  riskLevel: string;
}> {
  // Call WOUAKA CORE edge function with all data
  const { data: coreResult, error } = await supabase.functions.invoke('wouaka-core', {
    body: {
      reference_id: data.externalReference,
      kyc_level: data.kycLevel || 'basic',
      national_id: data.nationalId || `TEMP-${Date.now()}`,
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth || '1990-01-01',
      phone_number: data.phoneNumber,
      country: data.country || 'CI',
      city: data.city,
      address: data.city,
      // Financial
      monthly_income: data.monthlyIncome,
      monthly_expenses: data.monthlyExpenses,
      existing_loans: data.existingLoans,
      employment_type: data.employmentType === 'salaried' ? 'formal' :
                       data.employmentType === 'self-employed' ? 'self_employed' :
                       'informal',
      years_in_business: data.yearsInBusiness,
      sector: data.sector,
      // Mobile Money
      momo_total_in: data.momoTotalIn,
      momo_total_out: data.momoTotalOut,
      momo_transaction_count: data.momoTransactionCount,
      momo_period_days: data.momoPeriodDays || 30,
      // Utility
      utility_payments_on_time: data.utilityPaymentsOnTime,
      utility_payments_late: data.utilityPaymentsLate,
      // Social
      tontine_participation: data.tontineParticipation,
      tontine_discipline_rate: data.tontineDisciplineRate,
      cooperative_member: data.cooperativeMember,
      guarantor_count: data.guarantorCount,
      // Telecom
      sim_age_months: data.simAgeMonths,
      // Business
      rccm_number: data.rccmNumber,
      // Consent
      consent_data_processing: true,
      consent_timestamp: new Date().toISOString(),
    }
  });

  if (error) throw error;

  // Build verifications from KYC checks
  const verificationsPerformed = Object.entries(coreResult?.kyc?.checks || {}).map(([key, check]: [string, any]) => ({
    check: key,
    passed: check.passed,
    message: check.message,
    confidence: check.confidence,
  }));

  // Save KYC request
  const { data: kycRequest, error: kycError } = await supabase
    .from('kyc_requests')
    .insert({
      partner_id: partnerId,
      customer_profile_id: customerProfileId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      national_id: data.nationalId,
      status: coreResult?.kyc?.status === 'verified' ? 'verified' : 'pending',
      identity_score: coreResult?.kyc?.risk_score ? Math.round(100 - coreResult.kyc.risk_score) : 50,
      fraud_score: coreResult?.kyc?.fraud_indicators?.filter((i: any) => i.detected).length * 20 || 0,
      risk_level: coreResult?.kyc?.risk_level || 'medium',
      processing_time_ms: coreResult?.processing_time_ms,
      kyc_level: data.kycLevel || 'basic',
      documents_submitted: data.documents?.length || 0,
      documents_verified: data.documents?.filter(d => d.status === 'verified').length || 0,
      verifications_performed: verificationsPerformed,
      fraud_indicators: coreResult?.kyc?.fraud_indicators || [],
    })
    .select('id')
    .single();

  if (kycError) throw kycError;

  // Save scoring request
  const { data: scoringRequest, error: scoreError } = await supabase
    .from('scoring_requests')
    .insert({
      user_id: partnerId,
      customer_profile_id: customerProfileId,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      national_id: data.nationalId,
      company_name: data.companyName,
      monthly_income: data.monthlyIncome,
      employment_type: data.employmentType,
      city: data.city,
      score: coreResult?.score?.final_score || 0,
      grade: coreResult?.score?.grade || 'C',
      risk_category: coreResult?.score?.risk_tier || 'standard',
      confidence: coreResult?.score?.confidence,
      status: 'completed',
      processing_time_ms: coreResult?.processing_time_ms,
      explanations: coreResult?.explainability,
      recommendations: coreResult?.score?.credit_recommendation,
      sub_scores: coreResult?.score?.sub_scores || {},
      fraud_analysis: { fraud_score: coreResult?.score?.fraud_score || 0 },
      data_quality: coreResult?.score?.confidence >= 70 ? 'high' : 
                    coreResult?.score?.confidence >= 50 ? 'medium' : 'low',
      credit_recommendation: coreResult?.score?.credit_recommendation || {},
    })
    .select('id')
    .single();

  if (scoreError) throw scoreError;

  // Update customer profile
  await supabase
    .from('customer_profiles')
    .update({
      composite_score: coreResult?.score?.final_score,
      risk_score: coreResult?.combined_risk_score,
      last_enriched_at: new Date().toISOString(),
    })
    .eq('id', customerProfileId);

  return {
    scoringRequestId: scoringRequest.id,
    kycRequestId: kycRequest.id,
    score: coreResult?.score?.final_score || 0,
    grade: coreResult?.score?.grade || 'C',
    kycStatus: coreResult?.kyc?.status || 'pending',
    riskLevel: coreResult?.combined_risk_level || 'medium',
  };
}

export function useEvaluateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EvaluationData): Promise<EvaluationResult> => {
      if (!user?.id) throw new Error("Non authentifié");

      // Step 1: Ensure customer profile exists
      const customerProfileId = await ensureCustomerProfile(user.id, data);

      // Step 2: Run the appropriate evaluation based on product
      let result: EvaluationResult = {
        success: true,
        product: data.product,
        clientProfileId: customerProfileId,
      };

      switch (data.product) {
        case 'w-kyc': {
          const kycResult = await runKycEvaluation(user.id, customerProfileId, data);
          result.kycRequestId = kycResult.kycRequestId;
          result.kycStatus = kycResult.status;
          result.riskLevel = kycResult.riskLevel;
          result.score = kycResult.identityScore;
          break;
        }

        case 'w-score': {
          const scoreResult = await runScoreEvaluation(user.id, customerProfileId, data);
          result.scoringRequestId = scoreResult.scoringRequestId;
          result.score = scoreResult.score;
          result.grade = scoreResult.grade;
          result.riskLevel = scoreResult.riskCategory;
          break;
        }

        case 'wouaka-core': {
          const coreResult = await runCoreEvaluation(user.id, customerProfileId, data);
          result.scoringRequestId = coreResult.scoringRequestId;
          result.kycRequestId = coreResult.kycRequestId;
          result.score = coreResult.score;
          result.grade = coreResult.grade;
          result.kycStatus = coreResult.kycStatus;
          result.riskLevel = coreResult.riskLevel;
          break;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['customer-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      queryClient.invalidateQueries({ queryKey: ['score-requests'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-requests'] });
      queryClient.invalidateQueries({ queryKey: ['kyc-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-stats'] });
      queryClient.invalidateQueries({ queryKey: ['partner-evaluations'] });

      const productNames = {
        'w-kyc': 'Vérification Identité',
        'w-score': 'Scoring Crédit',
        'wouaka-core': 'Dossier Complet',
      };

      toast.success(
        `Évaluation ${productNames[result.product as keyof typeof productNames]} terminée`,
        {
          description: result.score 
            ? `Score: ${result.score}/100 - Grade: ${result.grade || 'N/A'}`
            : `Statut KYC: ${result.kycStatus || 'En cours'}`,
        }
      );
    },
    onError: (error) => {
      console.error('Evaluation error:', error);
      toast.error("Erreur lors de l'évaluation", {
        description: error instanceof Error ? error.message : "Veuillez réessayer",
      });
    },
  });
}
