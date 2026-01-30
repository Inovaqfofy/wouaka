/**
 * Partner Attestations System
 * Allows trusted partners (MFIs, cooperatives) to validate borrower data
 */

export interface AttestationType {
  id: string;
  name: string;
  description: string;
  required_fields: string[];
  confidence_boost: number; // Points added to confidence
  validity_days: number;
}

export interface Attestation {
  id: string;
  type: AttestationType['id'];
  partner_id: string;
  partner_name: string;
  partner_type: 'mfi' | 'cooperative' | 'tontine_leader' | 'employer' | 'bank';
  beneficiary_id: string;
  beneficiary_name: string;
  attested_data: Record<string, unknown>;
  signature_hash: string;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
  revoked_at?: string;
  revocation_reason?: string;
}

// ============================================
// ATTESTATION TYPES
// ============================================

export const ATTESTATION_TYPES: AttestationType[] = [
  {
    id: 'tontine_membership',
    name: 'Adhésion Tontine',
    description: 'Atteste de la participation active à une tontine',
    required_fields: ['tontine_name', 'membership_since', 'contribution_amount', 'discipline_rate'],
    confidence_boost: 15,
    validity_days: 90,
  },
  {
    id: 'cooperative_membership',
    name: 'Adhésion Coopérative',
    description: 'Atteste de l\'appartenance à une coopérative agricole ou commerciale',
    required_fields: ['cooperative_name', 'membership_number', 'member_since'],
    confidence_boost: 12,
    validity_days: 180,
  },
  {
    id: 'income_verification',
    name: 'Vérification de Revenus',
    description: 'Atteste des revenus déclarés par un employeur ou partenaire',
    required_fields: ['employer_name', 'monthly_income', 'employment_type', 'employment_since'],
    confidence_boost: 25,
    validity_days: 60,
  },
  {
    id: 'business_activity',
    name: 'Activité Commerciale',
    description: 'Atteste de l\'activité commerciale par un fournisseur ou partenaire',
    required_fields: ['business_name', 'activity_type', 'monthly_revenue_estimate', 'relationship_duration'],
    confidence_boost: 18,
    validity_days: 90,
  },
  {
    id: 'loan_history',
    name: 'Historique de Crédit',
    description: 'Atteste de l\'historique de remboursement auprès d\'une MFI',
    required_fields: ['mfi_name', 'loan_count', 'total_borrowed', 'repayment_rate', 'last_loan_date'],
    confidence_boost: 30,
    validity_days: 180,
  },
  {
    id: 'savings_account',
    name: 'Compte Épargne',
    description: 'Atteste d\'un compte épargne actif',
    required_fields: ['institution_name', 'account_age_months', 'average_balance'],
    confidence_boost: 15,
    validity_days: 60,
  },
  {
    id: 'address_verification',
    name: 'Vérification Adresse',
    description: 'Atteste de l\'adresse de résidence',
    required_fields: ['address', 'city', 'residence_duration_months'],
    confidence_boost: 10,
    validity_days: 365,
  },
];

// ============================================
// PARTNER TRUST LEVELS
// ============================================

export interface PartnerTrustLevel {
  partner_type: Attestation['partner_type'];
  base_trust: number; // 0-100
  attestation_weight: number; // Multiplier for confidence boost
  max_attestations_per_day: number;
  requires_verification: boolean;
}

export const PARTNER_TRUST_LEVELS: PartnerTrustLevel[] = [
  {
    partner_type: 'bank',
    base_trust: 95,
    attestation_weight: 1.2,
    max_attestations_per_day: 100,
    requires_verification: false,
  },
  {
    partner_type: 'mfi',
    base_trust: 85,
    attestation_weight: 1.0,
    max_attestations_per_day: 50,
    requires_verification: false,
  },
  {
    partner_type: 'cooperative',
    base_trust: 70,
    attestation_weight: 0.8,
    max_attestations_per_day: 30,
    requires_verification: true,
  },
  {
    partner_type: 'employer',
    base_trust: 75,
    attestation_weight: 0.9,
    max_attestations_per_day: 20,
    requires_verification: true,
  },
  {
    partner_type: 'tontine_leader',
    base_trust: 60,
    attestation_weight: 0.7,
    max_attestations_per_day: 15,
    requires_verification: true,
  },
];

// ============================================
// ATTESTATION FUNCTIONS
// ============================================

/**
 * Get attestation type by ID
 */
export function getAttestationType(typeId: string): AttestationType | undefined {
  return ATTESTATION_TYPES.find(t => t.id === typeId);
}

/**
 * Get partner trust level
 */
export function getPartnerTrustLevel(partnerType: Attestation['partner_type']): PartnerTrustLevel | undefined {
  return PARTNER_TRUST_LEVELS.find(p => p.partner_type === partnerType);
}

/**
 * Calculate confidence boost from an attestation
 */
export function calculateAttestationBoost(attestation: Attestation): number {
  const attestationType = getAttestationType(attestation.type);
  const partnerTrust = getPartnerTrustLevel(attestation.partner_type);

  if (!attestationType || !partnerTrust || !attestation.is_valid) {
    return 0;
  }

  // Check if expired
  if (new Date(attestation.expires_at) < new Date()) {
    return 0;
  }

  // Calculate boost: base boost * partner weight * (partner trust / 100)
  const boost = attestationType.confidence_boost * 
    partnerTrust.attestation_weight * 
    (partnerTrust.base_trust / 100);

  return Math.round(boost);
}

/**
 * Calculate total confidence boost from multiple attestations
 */
export function calculateTotalAttestationBoost(attestations: Attestation[]): {
  total_boost: number;
  valid_attestations: number;
  attestation_details: { type: string; partner: string; boost: number }[];
} {
  const validAttestations = attestations.filter(a => {
    if (!a.is_valid) return false;
    if (new Date(a.expires_at) < new Date()) return false;
    return true;
  });

  const details = validAttestations.map(a => ({
    type: a.type,
    partner: a.partner_name,
    boost: calculateAttestationBoost(a),
  }));

  // Apply diminishing returns for multiple attestations
  let totalBoost = 0;
  const sortedDetails = details.sort((a, b) => b.boost - a.boost);
  
  for (let i = 0; i < sortedDetails.length; i++) {
    // Each subsequent attestation adds less (80% of previous weight)
    const diminishingFactor = Math.pow(0.8, i);
    totalBoost += sortedDetails[i].boost * diminishingFactor;
  }

  // Cap total boost at 50 points
  totalBoost = Math.min(50, Math.round(totalBoost));

  return {
    total_boost: totalBoost,
    valid_attestations: validAttestations.length,
    attestation_details: details,
  };
}

/**
 * Validate attestation data completeness
 */
export function validateAttestationData(
  typeId: string,
  data: Record<string, unknown>
): { valid: boolean; missing_fields: string[] } {
  const attestationType = getAttestationType(typeId);
  
  if (!attestationType) {
    return { valid: false, missing_fields: ['unknown_attestation_type'] };
  }

  const missingFields = attestationType.required_fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missingFields.length === 0,
    missing_fields: missingFields,
  };
}

/**
 * Create attestation signature hash
 */
export async function createAttestationSignature(
  partnerId: string,
  beneficiaryId: string,
  attestationType: string,
  data: Record<string, unknown>
): Promise<string> {
  const payload = JSON.stringify({
    partner: partnerId,
    beneficiary: beneficiaryId,
    type: attestationType,
    data,
    timestamp: Date.now(),
  });

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
