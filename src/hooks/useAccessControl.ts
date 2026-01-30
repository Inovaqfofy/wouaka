import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBorrowerCertificate } from './useBorrowerCertificate';
import { useTrialSubscription } from './useTrialSubscription';
import { useQuotaUsage } from './useQuotaUsage';
import { useKyc } from './useKyc';

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'none';
export type KycStatus = 'none' | 'pending' | 'validated' | 'rejected';
export type UserType = 'borrower' | 'partner' | 'admin' | 'unknown';

export interface QuotaStatus {
  scores: { used: number; limit: number; percentage: number; available: boolean };
  kyc: { used: number; limit: number; percentage: number; available: boolean };
  api: { used: number; limit: number; percentage: number; available: boolean };
}

export interface AccessControlResult {
  // User type
  userType: UserType;
  
  // Subscription status
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  subscriptionStatus: SubscriptionStatus;
  planName: string | null;
  
  // Quota status
  quotaStatus: QuotaStatus;
  anyQuotaReached: boolean;
  
  // KYC status (primarily for borrowers)
  kycComplete: boolean;
  kycStatus: KycStatus;
  documentsRequired: number;
  documentsUploaded: number;
  
  // Certificate status (borrowers only)
  hasCertificate: boolean;
  certificateDaysRemaining: number;
  canRecertify: boolean;
  
  // Combined permissions
  canAccessPremium: boolean;
  canUseScoring: boolean;
  canUseKyc: boolean;
  canUseApi: boolean;
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  hasError: boolean;
}

/**
 * Hook centralisé pour le contrôle d'accès
 * Combine les vérifications d'abonnement, KYC et quotas
 */
export function useAccessControl(): AccessControlResult {
  const { role, user } = useAuth();
  
  // Déterminer le type d'utilisateur
  const userType: UserType = useMemo(() => {
    if (!role) return 'unknown';
    if (role === 'SUPER_ADMIN') return 'admin';
    if (role === 'EMPRUNTEUR') return 'borrower';
    if (['PARTENAIRE', 'ANALYSTE', 'ENTREPRISE', 'API_CLIENT'].includes(role)) return 'partner';
    return 'unknown';
  }, [role]);

  // Hooks conditionnels basés sur le type d'utilisateur
  const borrowerCertificate = useBorrowerCertificate();
  const trialSubscription = useTrialSubscription();
  const quotaUsage = useQuotaUsage();
  const kyc = useKyc();

  // Calculer le statut d'abonnement
  const subscriptionData = useMemo(() => {
    if (userType === 'admin') {
      return {
        hasActiveSubscription: true,
        isTrialing: false,
        isTrialExpired: false,
        trialDaysLeft: 0,
        subscriptionStatus: 'active' as SubscriptionStatus,
        planName: 'Admin',
      };
    }

    if (userType === 'borrower') {
      const status = borrowerCertificate.status;
      return {
        hasActiveSubscription: status?.hasSubscription ?? false,
        isTrialing: false,
        isTrialExpired: status?.isExpired ?? false,
        trialDaysLeft: 0,
        subscriptionStatus: status?.hasSubscription 
          ? (status?.isExpired ? 'expired' : 'active') 
          : 'none' as SubscriptionStatus,
        planName: status?.plan?.name ?? null,
      };
    }

    if (userType === 'partner') {
      const { isTrialing, isExpired, trialDaysLeft } = trialSubscription;
      const hasActive = isTrialing && !isExpired;
      return {
        hasActiveSubscription: hasActive || (quotaUsage.data?.plan?.slug !== 'free'),
        isTrialing: isTrialing ?? false,
        isTrialExpired: isExpired ?? false,
        trialDaysLeft: trialDaysLeft ?? 0,
        subscriptionStatus: isTrialing 
          ? (isExpired ? 'expired' : 'trialing') 
          : (quotaUsage.data?.plan?.slug !== 'free' ? 'active' : 'none') as SubscriptionStatus,
        planName: quotaUsage.data?.plan?.name ?? null,
      };
    }

    return {
      hasActiveSubscription: false,
      isTrialing: false,
      isTrialExpired: false,
      trialDaysLeft: 0,
      subscriptionStatus: 'none' as SubscriptionStatus,
      planName: null,
    };
  }, [userType, borrowerCertificate.status, trialSubscription, quotaUsage.data]);

  // Calculer le statut des quotas
  const quotaStatus = useMemo((): QuotaStatus => {
    const data = quotaUsage.data;
    if (!data) {
      return {
        scores: { used: 0, limit: 0, percentage: 0, available: false },
        kyc: { used: 0, limit: 0, percentage: 0, available: false },
        api: { used: 0, limit: 0, percentage: 0, available: false },
      };
    }

    const isUnlimited = (limit: number) => limit === -1;

    return {
      scores: {
        used: data.usage.scoresUsed,
        limit: data.plan.limits.scores_per_month,
        percentage: data.percentages.scores,
        available: isUnlimited(data.plan.limits.scores_per_month) || data.remaining.scores > 0,
      },
      kyc: {
        used: data.usage.kycUsed,
        limit: data.plan.limits.kyc_per_month,
        percentage: data.percentages.kyc,
        available: isUnlimited(data.plan.limits.kyc_per_month) || data.remaining.kyc > 0,
      },
      api: {
        used: data.usage.apiCallsUsed,
        limit: data.plan.limits.api_calls_per_month,
        percentage: data.percentages.apiCalls,
        available: isUnlimited(data.plan.limits.api_calls_per_month) || data.remaining.apiCalls > 0,
      },
    };
  }, [quotaUsage.data]);

  // Calculer le statut KYC
  const kycData = useMemo(() => {
    const status = kyc.getKycStatus();
    let kycStatusValue: KycStatus = 'none';
    
    if (status.isVerified) {
      kycStatusValue = 'validated';
    } else if (status.documentsUploaded > 0) {
      kycStatusValue = 'pending';
    }

    return {
      kycComplete: status.isComplete && status.isVerified,
      kycStatus: kycStatusValue,
      documentsRequired: status.documentsRequired,
      documentsUploaded: status.documentsUploaded,
    };
  }, [kyc]);

  // Calculer le statut du certificat (emprunteurs)
  const certificateData = useMemo(() => {
    if (userType !== 'borrower') {
      return {
        hasCertificate: false,
        certificateDaysRemaining: 0,
        canRecertify: false,
      };
    }

    const status = borrowerCertificate.status;
    return {
      hasCertificate: status?.hasActiveCertificate ?? false,
      certificateDaysRemaining: status?.daysRemaining ?? 0,
      canRecertify: status?.canRecertify ?? false,
    };
  }, [userType, borrowerCertificate.status]);

  // Calculer les permissions combinées
  const permissions = useMemo(() => {
    // Admin a accès à tout
    if (userType === 'admin') {
      return {
        canAccessPremium: true,
        canUseScoring: true,
        canUseKyc: true,
        canUseApi: true,
      };
    }

    const hasSubscription = subscriptionData.hasActiveSubscription;
    const notExpired = !subscriptionData.isTrialExpired;
    const baseAccess = hasSubscription && notExpired;

    return {
      canAccessPremium: baseAccess,
      canUseScoring: baseAccess && quotaStatus.scores.available,
      canUseKyc: baseAccess && quotaStatus.kyc.available,
      canUseApi: baseAccess && quotaStatus.api.available,
    };
  }, [userType, subscriptionData, quotaStatus]);

  // État de chargement global
  const isLoading = useMemo(() => {
    if (!user) return false;
    return borrowerCertificate.isLoading || 
           trialSubscription.isLoading || 
           quotaUsage.isLoading;
  }, [user, borrowerCertificate.isLoading, trialSubscription.isLoading, quotaUsage.isLoading]);

  // Vérifier si un quota est atteint
  const anyQuotaReached = useMemo(() => {
    return !quotaStatus.scores.available || 
           !quotaStatus.kyc.available || 
           !quotaStatus.api.available;
  }, [quotaStatus]);

  return {
    userType,
    ...subscriptionData,
    quotaStatus,
    anyQuotaReached,
    ...kycData,
    ...certificateData,
    ...permissions,
    isLoading,
    hasError: false,
  };
}
