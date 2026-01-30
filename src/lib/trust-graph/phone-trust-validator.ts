/**
 * WOUAKA Phone Trust Validator
 * Orchestrates the complete phone validation workflow
 */

import { supabase } from '@/integrations/supabase/client';
import { analyzeUssdScreenshot, validateForCertification, type UssdScreenshotResult } from './ussd-screenshot-analyzer';
import { extractFromSmsMessages, type SmsMessage, type ExtractionResult } from './sms-transaction-extractor';
import { calculateTrustLevel, calculateActivityLevel } from './certainty-calculator';

export interface PhoneTrustState {
  phoneNumber: string;
  userId: string;
  
  // Stage completion
  otpVerified: boolean;
  otpVerifiedAt?: Date;
  
  ussdUploaded: boolean;
  ussdAnalysis?: UssdScreenshotResult;
  ussdVerifiedAt?: Date;
  
  identityCrossValidated: boolean;
  identityMatchScore: number;
  identityValidatedAt?: Date;
  
  smsConsentGiven: boolean;
  smsAnalysis?: ExtractionResult;
  smsAnalyzedAt?: Date;
  
  // Computed scores
  trustScore: number;
  trustLevel: string;
  phoneAgeMonths?: number;
  activityLevel: string;
  
  // Flags
  multipleUsersDetected: boolean;
  fraudFlags: Array<{ type: string; severity: string; detected_at: string }>;
}

export interface ValidationProgress {
  currentStage: 'otp' | 'ussd' | 'identity' | 'sms' | 'complete';
  completedStages: string[];
  progressPercent: number;
  nextAction?: string;
}

/**
 * Get or create phone trust record
 */
export async function getOrCreatePhoneTrust(
  phoneNumber: string,
  userId: string
): Promise<PhoneTrustState> {
  // Try to get existing record
  const { data: existing } = await supabase
    .from('phone_trust_scores')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return mapDbToState(existing);
  }

  // Create new record
  const { data: created, error } = await supabase
    .from('phone_trust_scores')
    .insert({
      phone_number: phoneNumber,
      user_id: userId,
      trust_score: 0,
      trust_level: 'unverified',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création trust score: ${error.message}`);
  }

  return mapDbToState(created);
}

/**
 * Map database record to state object
 */
function mapDbToState(record: Record<string, unknown>): PhoneTrustState {
  return {
    phoneNumber: record.phone_number as string,
    userId: record.user_id as string,
    otpVerified: record.otp_verified as boolean || false,
    otpVerifiedAt: record.otp_verified_at ? new Date(record.otp_verified_at as string) : undefined,
    ussdUploaded: record.ussd_screenshot_uploaded as boolean || false,
    ussdVerifiedAt: record.ussd_verified_at ? new Date(record.ussd_verified_at as string) : undefined,
    identityCrossValidated: record.identity_cross_validated as boolean || false,
    identityMatchScore: record.identity_match_score as number || 0,
    identityValidatedAt: record.identity_validated_at ? new Date(record.identity_validated_at as string) : undefined,
    smsConsentGiven: record.sms_consent_given as boolean || false,
    smsAnalyzedAt: record.sms_analyzed_at ? new Date(record.sms_analyzed_at as string) : undefined,
    trustScore: record.trust_score as number || 0,
    trustLevel: record.trust_level as string || 'unverified',
    phoneAgeMonths: record.phone_age_months as number | undefined,
    activityLevel: record.activity_level as string || 'unknown',
    multipleUsersDetected: record.multiple_users_detected as boolean || false,
    fraudFlags: (record.fraud_flags as Array<{ type: string; severity: string; detected_at: string }>) || [],
  };
}

/**
 * Stage 1: Mark OTP as verified
 */
export async function markOtpVerified(
  phoneNumber: string,
  userId: string,
  verificationToken: string
): Promise<PhoneTrustState> {
  const { data, error } = await supabase
    .from('phone_trust_scores')
    .upsert({
      phone_number: phoneNumber,
      user_id: userId,
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
    }, {
      onConflict: 'phone_number',
    })
    .select()
    .single();

  if (error) throw error;
  
  // Recalculate trust score
  await recalculateTrustScore(phoneNumber);
  
  return getOrCreatePhoneTrust(phoneNumber, userId);
}

/**
 * Stage 2: Process USSD screenshot
 */
export async function processUssdScreenshot(
  phoneNumber: string,
  userId: string,
  imageFile: File | Blob,
  cniName?: string
): Promise<{
  state: PhoneTrustState;
  analysis: UssdScreenshotResult;
  validation: ReturnType<typeof validateForCertification>;
}> {
  // Analyze screenshot locally
  const analysis = await analyzeUssdScreenshot(imageFile, cniName);
  const validation = validateForCertification(analysis);
  
  // Calculate image hash for dedup (simple hash)
  const imageBuffer = await imageFile.arrayBuffer();
  const hashArray = new Uint8Array(imageBuffer.slice(0, 1000));
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);
  
  // Save validation record (no image stored!)
  await supabase.from('ussd_screenshot_validations').insert({
    user_id: userId,
    phone_number: phoneNumber,
    provider_detected: analysis.provider,
    screen_type: analysis.screenType,
    extracted_name: analysis.extractedName,
    extracted_phone: analysis.extractedPhone,
    extracted_balance: analysis.extractedBalance,
    ocr_confidence: analysis.ocrConfidence,
    tampering_probability: analysis.tamperingProbability,
    ui_authenticity_score: analysis.uiAuthenticityScore,
    cni_name: cniName,
    name_match_score: analysis.nameMatchResult?.matchScore || 0,
    is_name_match: analysis.nameMatchResult?.isMatch || false,
    validation_status: validation.canCertify ? 'validated' : 'pending',
    rejection_reason: validation.reasons.length > 0 ? validation.reasons.join('; ') : null,
    image_hash: hashHex,
  });
  
  // Update phone trust score
  const identityMatched = analysis.nameMatchResult?.isMatch || false;
  const identityScore = analysis.nameMatchResult?.matchScore || 0;
  
  await supabase
    .from('phone_trust_scores')
    .update({
      ussd_screenshot_uploaded: true,
      ussd_name_extracted: analysis.extractedName,
      ussd_verification_confidence: validation.score,
      ussd_verified_at: new Date().toISOString(),
      identity_cross_validated: identityMatched,
      identity_match_score: identityScore,
      identity_validated_at: identityMatched ? new Date().toISOString() : null,
    })
    .eq('phone_number', phoneNumber)
    .eq('user_id', userId);
  
  await recalculateTrustScore(phoneNumber);
  
  return {
    state: await getOrCreatePhoneTrust(phoneNumber, userId),
    analysis,
    validation,
  };
}

/**
 * Stage 3: Process SMS history (consent-based)
 */
export async function processSmsHistory(
  phoneNumber: string,
  userId: string,
  smsMessages: SmsMessage[],
  consentId: string
): Promise<{
  state: PhoneTrustState;
  extraction: ExtractionResult;
}> {
  // All processing is LOCAL
  const extraction = extractFromSmsMessages(smsMessages);
  
  // Save transactions to database
  const transactionsToInsert = extraction.transactions.map(tx => ({
    user_id: userId,
    phone_number: phoneNumber,
    provider: tx.provider,
    transaction_type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    balance_after: tx.balanceAfter,
    counterparty_name: tx.counterparty,
    reference: tx.reference,
    transaction_date: tx.date.toISOString(),
    source_type: 'sms_parsed',
    source_confidence: tx.confidence,
    consent_id: consentId,
  }));
  
  if (transactionsToInsert.length > 0) {
    await supabase.from('user_momo_transactions').insert(transactionsToInsert);
  }
  
  // Save utility bills
  const billsToInsert = extraction.utilityBills.map(bill => ({
    user_id: userId,
    phone_number: phoneNumber,
    utility_type: bill.utilityType,
    provider_name: bill.providerName,
    bill_amount: bill.amount,
    bill_date: bill.billDate?.toISOString(),
    paid_date: bill.paidDate?.toISOString(),
    payment_status: bill.paymentStatus,
    source_type: 'sms_parsed',
    source_confidence: bill.confidence,
    bill_reference: bill.reference,
  }));
  
  if (billsToInsert.length > 0) {
    await supabase.from('user_utility_bills').insert(billsToInsert);
  }
  
  // Update phone trust score
  const activityLevel = calculateActivityLevel(
    extraction.transactions.length,
    extraction.aggregated.oldestTransaction
  );
  
  await supabase
    .from('phone_trust_scores')
    .update({
      sms_consent_given: true,
      sms_transactions_count: extraction.transactions.length,
      sms_oldest_transaction: extraction.aggregated.oldestTransaction?.toISOString(),
      sms_analyzed_at: new Date().toISOString(),
      phone_age_months: extraction.aggregated.phoneAgeMonths,
      activity_level: activityLevel,
      last_activity_date: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber)
    .eq('user_id', userId);
  
  await recalculateTrustScore(phoneNumber);
  
  return {
    state: await getOrCreatePhoneTrust(phoneNumber, userId),
    extraction,
  };
}

/**
 * Recalculate trust score using database function
 */
async function recalculateTrustScore(phoneNumber: string): Promise<void> {
  const { data: score } = await supabase.rpc('calculate_phone_trust_score', {
    p_phone_number: phoneNumber,
  });
  
  const trustLevel = calculateTrustLevel(score || 0);
  
  await supabase
    .from('phone_trust_scores')
    .update({
      trust_score: score || 0,
      trust_level: trustLevel,
    })
    .eq('phone_number', phoneNumber);
}

/**
 * Get validation progress
 */
export function getValidationProgress(state: PhoneTrustState): ValidationProgress {
  const completed: string[] = [];
  let progressPercent = 0;
  
  if (state.otpVerified) {
    completed.push('otp');
    progressPercent += 25;
  }
  
  if (state.ussdUploaded) {
    completed.push('ussd');
    progressPercent += 25;
  }
  
  if (state.identityCrossValidated) {
    completed.push('identity');
    progressPercent += 25;
  }
  
  if (state.smsConsentGiven) {
    completed.push('sms');
    progressPercent += 25;
  }
  
  let currentStage: ValidationProgress['currentStage'];
  let nextAction: string | undefined;
  
  if (!state.otpVerified) {
    currentStage = 'otp';
    nextAction = 'Vérifiez votre numéro par SMS';
  } else if (!state.ussdUploaded) {
    currentStage = 'ussd';
    nextAction = 'Uploadez une capture de votre profil Mobile Money';
  } else if (!state.identityCrossValidated) {
    currentStage = 'identity';
    nextAction = 'Vérifiez votre pièce d\'identité';
  } else if (!state.smsConsentGiven) {
    currentStage = 'sms';
    nextAction = 'Autorisez la lecture de vos SMS financiers';
  } else {
    currentStage = 'complete';
  }
  
  return {
    currentStage,
    completedStages: completed,
    progressPercent,
    nextAction,
  };
}
