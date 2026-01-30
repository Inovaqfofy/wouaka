/**
 * WOUAKA Hooks Index
 * Centralized exports for all React hooks
 */

// SDK Hooks (Source of Truth)
export { useWouakaSdk } from './useWouakaSdk';
export { useWouakaScore } from './useWouakaScore';
export { useWouakaKyc } from './useWouakaKyc';
export { useWouakaCore } from './useWouakaCore';
export type { CoreRequest, CoreResponse } from './useWouakaCore';

// Access Control (Centralized Guards)
export { useAccessControl } from './useAccessControl';
export type { 
  AccessControlResult, 
  SubscriptionStatus, 
  KycStatus, 
  UserType, 
  QuotaStatus 
} from './useAccessControl';

// Authentication
export { useAuth } from './useAuth';

// API & Data
export { useApiKeys } from './useApiKeys';
export { useApiCalls } from './useApiCalls';
export { useWebhooks } from './useWebhooks';
export { useNotifications } from './useNotifications';
export { useRealtimeNotifications } from './useRealtimeNotifications';

// Scoring & Evaluation
export { useScoring } from './useScoring';
export { useDataEnrichment } from './useDataEnrichment';
export { useEvaluateClient } from './useEvaluateClient';
export { usePartnerEvaluations, usePartnerEvaluationStats } from './usePartnerEvaluations';

// KYC & Identity
export { useKyc } from './useKyc';
export { usePhoneVerification } from './usePhoneVerification';
export { useFaceVerification } from './useFaceVerification';
export { useSmileIdVerification } from './useSmileIdVerification';

// Borrower
export { useBorrowerCertificate } from './useBorrowerCertificate';
export { useBorrowerProofStatus } from './useBorrowerProofStatus';

// Partner
export { usePartnerActivity } from './usePartnerActivity';
export { usePartnerApplications } from './usePartnerApplications';
export { usePartnerOffers } from './usePartnerOffers';
export { useCustomerProfiles } from './useCustomerProfiles';
export { useClientProfile } from './useClientProfile';

// Subscription & Billing
export { useSubscription } from './useSubscription';
export { useSubscriptionPlans, useBorrowerPlans, usePartnerPlans } from './useSubscriptionPlans';
export { useTrialSubscription } from './useTrialSubscription';
export { useQuotaUsage, formatLimit, getQuotaAlertLevel } from './useQuotaUsage';
export { useInvoices } from './useInvoices';

// Marketplace
export { useMarketplaceProducts } from './useMarketplaceProducts';
export { usePublicMarketplace, usePublicProduct } from './usePublicMarketplace';
export { usePublicApplications } from './useLoanApplications';

// Support
export { 
  useSupportTickets, 
  useSupportTicket, 
  useTicketMessages,
  useCreateTicket,
  useAddTicketMessage,
  useUpdateTicket,
  useTicketStats 
} from './useSupportTickets';

// Admin & Monitoring
export { useAdminStats } from './useAdminStats';
export { useAnalystStats } from './useAnalystStats';
export { useEnterpriseStats } from './useEnterpriseStats';
export {
  useKycHealthMetrics,
  useScoringMetrics,
  useMobileTrustMetrics,
  useEdgeFunctionMetrics,
  useEmailLogMetrics,
  useOcrErrors,
  useUserInvestigation,
} from './useMonitoringStats';

// OCR & Documents
export { useOCR } from './useOCR';
export { useDatasetImport } from './useDatasetImport';
export { useCreateScoringRequest } from './useCreateScoringRequest';

// Trust & Verification
export { usePhoneTrustIntegration } from './usePhoneTrustIntegration';
export { useValidateCertificateWeb } from './useValidateCertificateWeb';
export { useComplianceCertificate } from './useComplianceCertificate';

// Settings
export { useSettings } from './useSettings';

// User Data
export {
  useUserData,
  useUserIdentityData,
  useUserFinancialData,
  useUserSocialData,
  useUserScoringData,
  useUserFraudData,
  useUserDataSummary,
} from './useUserData';

// Behavioral
export { useBehavioralSignals } from './useBehavioralSignals';

// Payment
export { useCinetPay } from './useCinetPay';

// UI Utilities
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
