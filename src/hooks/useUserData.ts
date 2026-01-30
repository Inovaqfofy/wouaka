import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  UserIdentity,
  UserDevice,
  UserAddress,
  UserSelfieLiveness,
  UserBankStatement,
  UserMomoTransaction,
  UserUtilityBill,
  UserInformalIncome,
  UserTontineMembership,
  UserCooperativeMembership,
  UserGuarantor,
  UserCommunityAttestation,
  UserSocialLink,
  UserPsychometricResult,
  UserBehaviorMetric,
  UserEconomicContext,
  ScoreRawFeature,
  ScoreEngineeredFeature,
  ScoreHistory,
  DocumentFraudAnalysis,
  DeviceFraudAnalysis,
  BehaviorAnomaly,
  IdentityFraudRisk,
} from '@/lib/database-types';

// Types for the complete user data profile
export interface UserDataProfile {
  // Identity & KYC
  identities: UserIdentity[];
  devices: UserDevice[];
  addresses: UserAddress[];
  selfieLiveness: UserSelfieLiveness[];
  
  // Financial data
  bankStatements: UserBankStatement[];
  momoTransactions: UserMomoTransaction[];
  utilityBills: UserUtilityBill[];
  informalIncome: UserInformalIncome[];
  
  // Social capital
  tontineMemberships: UserTontineMembership[];
  cooperativeMemberships: UserCooperativeMembership[];
  guarantors: UserGuarantor[];
  communityAttestations: UserCommunityAttestation[];
  socialLinks: UserSocialLink[];
  
  // Behavioral & psychometric
  psychometricResults: UserPsychometricResult[];
  behaviorMetrics: UserBehaviorMetric[];
  economicContext: UserEconomicContext[];
  
  // Scoring
  scoreHistory: ScoreHistory[];
  rawFeatures: ScoreRawFeature[];
  engineeredFeatures: ScoreEngineeredFeature[];
  
  // Fraud analysis
  documentFraudAnalysis: DocumentFraudAnalysis[];
  deviceFraudAnalysis: DeviceFraudAnalysis[];
  behaviorAnomalies: BehaviorAnomaly[];
  identityFraudRisks: IdentityFraudRisk[];
}

// Summary statistics for dashboards
export interface UserDataSummary {
  totalIdentities: number;
  totalDevices: number;
  totalAddresses: number;
  totalBankStatements: number;
  totalMomoTransactions: number;
  totalUtilityBills: number;
  totalTontineMemberships: number;
  totalCooperativeMemberships: number;
  totalGuarantors: number;
  latestScore: number | null;
  latestGrade: string | null;
  fraudRiskLevel: 'low' | 'medium' | 'high' | 'critical' | null;
  kycComplete: boolean;
  financialDataComplete: boolean;
  socialCapitalScore: number;
}

type DataCategory = 
  | 'identity' 
  | 'financial' 
  | 'social' 
  | 'behavioral' 
  | 'scoring' 
  | 'fraud'
  | 'all';

interface UseUserDataOptions {
  userId?: string;
  categories?: DataCategory[];
  enabled?: boolean;
}

// Helper to fetch from a table with explicit table name types
type FetchableTable = 
  | 'user_identities' 
  | 'user_devices' 
  | 'user_addresses' 
  | 'user_selfie_liveness'
  | 'user_bank_statements'
  | 'user_momo_transactions'
  | 'user_utility_bills'
  | 'user_informal_income'
  | 'user_tontine_memberships'
  | 'user_cooperative_memberships'
  | 'user_guarantors'
  | 'user_community_attestations'
  | 'user_social_links'
  | 'user_psychometric_results'
  | 'user_behavior_metrics'
  | 'user_economic_context'
  | 'score_history'
  | 'behavior_anomalies'
  | 'identity_fraud_risk';

async function fetchTableData<T>(
  tableName: FetchableTable,
  userId: string,
  orderBy: string = 'created_at'
): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .order(orderBy, { ascending: false });

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }

  return (data || []) as T[];
}

// Fetch identity-related data
async function fetchIdentityData(userId: string) {
  const [identities, devices, addresses, selfieLiveness] = await Promise.all([
    fetchTableData<UserIdentity>('user_identities', userId, 'created_at'),
    fetchTableData<UserDevice>('user_devices', userId, 'last_seen_at'),
    fetchTableData<UserAddress>('user_addresses', userId, 'created_at'),
    fetchTableData<UserSelfieLiveness>('user_selfie_liveness', userId, 'created_at'),
  ]);

  return { identities, devices, addresses, selfieLiveness };
}

// Fetch financial data
async function fetchFinancialData(userId: string) {
  const [bankStatements, momoTransactions, utilityBills, informalIncome] = await Promise.all([
    fetchTableData<UserBankStatement>('user_bank_statements', userId, 'created_at'),
    fetchTableData<UserMomoTransaction>('user_momo_transactions', userId, 'created_at'),
    fetchTableData<UserUtilityBill>('user_utility_bills', userId, 'created_at'),
    fetchTableData<UserInformalIncome>('user_informal_income', userId, 'created_at'),
  ]);

  return { bankStatements, momoTransactions, utilityBills, informalIncome };
}

// Fetch social capital data
async function fetchSocialData(userId: string) {
  const [tontineMemberships, cooperativeMemberships, guarantors, communityAttestations, socialLinks] = await Promise.all([
    fetchTableData<UserTontineMembership>('user_tontine_memberships', userId),
    fetchTableData<UserCooperativeMembership>('user_cooperative_memberships', userId),
    fetchTableData<UserGuarantor>('user_guarantors', userId),
    fetchTableData<UserCommunityAttestation>('user_community_attestations', userId),
    fetchTableData<UserSocialLink>('user_social_links', userId),
  ]);

  return { tontineMemberships, cooperativeMemberships, guarantors, communityAttestations, socialLinks };
}

// Fetch behavioral data
async function fetchBehavioralData(userId: string) {
  const [psychometricResults, behaviorMetrics, economicContext] = await Promise.all([
    fetchTableData<UserPsychometricResult>('user_psychometric_results', userId, 'created_at'),
    fetchTableData<UserBehaviorMetric>('user_behavior_metrics', userId, 'created_at'),
    fetchTableData<UserEconomicContext>('user_economic_context', userId, 'created_at'),
  ]);

  return { psychometricResults, behaviorMetrics, economicContext };
}

// Fetch scoring data
async function fetchScoringData(userId: string) {
  const [scoreHistory] = await Promise.all([
    fetchTableData<ScoreHistory>('score_history', userId),
  ]);

  // Raw and engineered features are linked to scoring_requests, not directly to user_id
  // We need to get them through the user's scoring requests
  const { data: scoringRequests } = await supabase
    .from('scoring_requests')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  let rawFeatures: ScoreRawFeature[] = [];
  let engineeredFeatures: ScoreEngineeredFeature[] = [];

  if (scoringRequests && scoringRequests.length > 0) {
    const requestIds = scoringRequests.map(r => r.id);

    const [rawData, engineeredData] = await Promise.all([
      supabase
        .from('score_raw_features')
        .select('*')
        .in('scoring_request_id', requestIds),
      supabase
        .from('score_engineered_features')
        .select('*')
        .in('scoring_request_id', requestIds),
    ]);

    rawFeatures = (rawData.data || []) as ScoreRawFeature[];
    engineeredFeatures = (engineeredData.data || []) as ScoreEngineeredFeature[];
  }

  return { scoreHistory, rawFeatures, engineeredFeatures };
}

// Fetch fraud analysis data
async function fetchFraudData(userId: string) {
  const [behaviorAnomalies, identityFraudRisks] = await Promise.all([
    fetchTableData<BehaviorAnomaly>('behavior_anomalies', userId),
    fetchTableData<IdentityFraudRisk>('identity_fraud_risk', userId),
  ]);

  // Document and device fraud are linked through other tables
  const { data: documents } = await supabase
    .from('kyc_documents')
    .select('id')
    .eq('user_id', userId);

  const { data: devices } = await supabase
    .from('user_devices')
    .select('id')
    .eq('user_id', userId);

  let documentFraudAnalysis: DocumentFraudAnalysis[] = [];
  let deviceFraudAnalysis: DeviceFraudAnalysis[] = [];

  if (documents && documents.length > 0) {
    const docIds = documents.map(d => d.id);
    const { data } = await supabase
      .from('document_fraud_analysis')
      .select('*')
      .in('document_id', docIds);
    documentFraudAnalysis = (data || []) as DocumentFraudAnalysis[];
  }

  if (devices && devices.length > 0) {
    const deviceIds = devices.map(d => d.id);
    const { data } = await supabase
      .from('device_fraud_analysis')
      .select('*')
      .in('device_id', deviceIds);
    deviceFraudAnalysis = (data || []) as DeviceFraudAnalysis[];
  }

  return { documentFraudAnalysis, deviceFraudAnalysis, behaviorAnomalies, identityFraudRisks };
}

// Calculate summary statistics
function calculateSummary(data: UserDataProfile): UserDataSummary {
  const latestScoreEntry = data.scoreHistory[0];
  
  // Calculate social capital score based on memberships
  const tontineScore = data.tontineMemberships.reduce((acc, t) => {
    const discipline = t.discipline_score || 0;
    const role = t.is_organizer ? 20 : t.is_treasurer ? 15 : 0;
    return acc + discipline + role;
  }, 0);

  const coopScore = data.cooperativeMemberships.reduce((acc, c) => {
    const standing = c.standing_score || 0;
    const roleBonus = c.role === 'president' ? 25 : c.role === 'treasurer' ? 20 : c.role === 'board' ? 15 : 0;
    return acc + standing + roleBonus;
  }, 0);

  const guarantorScore = data.guarantors.filter(g => g.consent_given && g.identity_verified).length * 10;
  const attestationScore = data.communityAttestations.filter(a => a.verified).length * 15;

  const socialCapitalScore = Math.min(100, tontineScore + coopScore + guarantorScore + attestationScore);

  // Determine fraud risk level
  let fraudRiskLevel: 'low' | 'medium' | 'high' | 'critical' | null = null;
  const highRiskAnomalies = data.behaviorAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical');
  const criticalFraudDocs = data.documentFraudAnalysis.filter(d => (d.fraud_probability || 0) > 0.7);
  
  if (criticalFraudDocs.length > 0 || highRiskAnomalies.some(a => a.severity === 'critical')) {
    fraudRiskLevel = 'critical';
  } else if (highRiskAnomalies.length > 0 || criticalFraudDocs.length > 0) {
    fraudRiskLevel = 'high';
  } else if (data.behaviorAnomalies.length > 0 || data.documentFraudAnalysis.some(d => (d.fraud_probability || 0) > 0.3)) {
    fraudRiskLevel = 'medium';
  } else if (data.identities.length > 0) {
    fraudRiskLevel = 'low';
  }

  // Check KYC completeness
  const hasVerifiedIdentity = data.identities.some(i => i.verified);
  const hasVerifiedAddress = data.addresses.some(a => a.verified);
  const hasLiveness = data.selfieLiveness.some(s => s.is_live);
  const kycComplete = hasVerifiedIdentity && hasVerifiedAddress && hasLiveness;

  // Check financial data completeness
  const hasFinancialData = 
    data.bankStatements.length > 0 || 
    data.momoTransactions.length > 0 || 
    data.informalIncome.length > 0;
  const financialDataComplete = hasFinancialData && data.utilityBills.length >= 2;

  return {
    totalIdentities: data.identities.length,
    totalDevices: data.devices.length,
    totalAddresses: data.addresses.length,
    totalBankStatements: data.bankStatements.length,
    totalMomoTransactions: data.momoTransactions.length,
    totalUtilityBills: data.utilityBills.length,
    totalTontineMemberships: data.tontineMemberships.length,
    totalCooperativeMemberships: data.cooperativeMemberships.length,
    totalGuarantors: data.guarantors.length,
    latestScore: latestScoreEntry?.score_value || null,
    latestGrade: latestScoreEntry?.grade || null,
    fraudRiskLevel,
    kycComplete,
    financialDataComplete,
    socialCapitalScore,
  };
}

// Main hook
export function useUserData(options: UseUserDataOptions = {}) {
  const { user } = useAuth();
  const { 
    userId = user?.id, 
    categories = ['all'], 
    enabled = true 
  } = options;

  const shouldFetch = (category: DataCategory) => 
    categories.includes('all') || categories.includes(category);

  return useQuery({
    queryKey: ['userData', userId, categories],
    queryFn: async (): Promise<{ data: UserDataProfile; summary: UserDataSummary }> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Fetch data in parallel based on requested categories
      const [identityData, financialData, socialData, behavioralData, scoringData, fraudData] = await Promise.all([
        shouldFetch('identity') ? fetchIdentityData(userId) : Promise.resolve({ identities: [], devices: [], addresses: [], selfieLiveness: [] }),
        shouldFetch('financial') ? fetchFinancialData(userId) : Promise.resolve({ bankStatements: [], momoTransactions: [], utilityBills: [], informalIncome: [] }),
        shouldFetch('social') ? fetchSocialData(userId) : Promise.resolve({ tontineMemberships: [], cooperativeMemberships: [], guarantors: [], communityAttestations: [], socialLinks: [] }),
        shouldFetch('behavioral') ? fetchBehavioralData(userId) : Promise.resolve({ psychometricResults: [], behaviorMetrics: [], economicContext: [] }),
        shouldFetch('scoring') ? fetchScoringData(userId) : Promise.resolve({ scoreHistory: [], rawFeatures: [], engineeredFeatures: [] }),
        shouldFetch('fraud') ? fetchFraudData(userId) : Promise.resolve({ documentFraudAnalysis: [], deviceFraudAnalysis: [], behaviorAnomalies: [], identityFraudRisks: [] }),
      ]);

      const data: UserDataProfile = {
        ...identityData,
        ...financialData,
        ...socialData,
        ...behavioralData,
        ...scoringData,
        ...fraudData,
      };

      const summary = calculateSummary(data);

      return { data, summary };
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
  });
}

// Specialized hooks for specific data categories
export function useUserIdentityData(userId?: string) {
  return useUserData({ userId, categories: ['identity'] });
}

export function useUserFinancialData(userId?: string) {
  return useUserData({ userId, categories: ['financial'] });
}

export function useUserSocialData(userId?: string) {
  return useUserData({ userId, categories: ['social'] });
}

export function useUserScoringData(userId?: string) {
  return useUserData({ userId, categories: ['scoring'] });
}

export function useUserFraudData(userId?: string) {
  return useUserData({ userId, categories: ['fraud'] });
}

// Hook to get just the summary for dashboard cards
export function useUserDataSummary(userId?: string) {
  const { data, isLoading, error } = useUserData({ userId });
  
  return {
    summary: data?.summary,
    isLoading,
    error,
  };
}
