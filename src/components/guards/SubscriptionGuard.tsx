import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAccessControl, UserType } from '@/hooks/useAccessControl';
import { PaywallOverlay } from './PaywallOverlay';
import { KycRequiredCard } from './KycRequiredCard';
import { QuotaExhaustedAlert } from './QuotaExhaustedAlert';

type FallbackBehavior = 'redirect' | 'paywall' | 'upgrade-prompt' | 'custom';
type QuotaRequirement = 'scores' | 'kyc' | 'api';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  
  // Conditions requises
  requireActiveSubscription?: boolean;
  requireKycComplete?: boolean;
  requireQuotaAvailable?: QuotaRequirement;
  
  // Comportement de fallback
  fallback?: FallbackBehavior;
  redirectTo?: string;
  customFallback?: React.ReactNode;
  
  // Type d'utilisateur (optionnel, auto-détecté si non fourni)
  userType?: 'borrower' | 'partner';
  
  // Messages personnalisés
  paywallTitle?: string;
  paywallDescription?: string;
  
  // Afficher le loading
  showLoading?: boolean;
}

/**
 * Guard centralisé pour protéger les fonctionnalités premium
 * Vérifie l'abonnement, le KYC et les quotas avant d'afficher le contenu
 */
export function SubscriptionGuard({
  children,
  requireActiveSubscription = false,
  requireKycComplete = false,
  requireQuotaAvailable,
  fallback = 'paywall',
  redirectTo = '/pricing',
  customFallback,
  userType: forcedUserType,
  paywallTitle,
  paywallDescription,
  showLoading = true,
}: SubscriptionGuardProps) {
  const accessControl = useAccessControl();
  
  // Déterminer le type d'utilisateur
  const effectiveUserType: 'borrower' | 'partner' = forcedUserType || 
    (accessControl.userType === 'borrower' ? 'borrower' : 'partner');

  // Afficher le loading si nécessaire
  if (accessControl.isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  // Admin bypass - accès total
  if (accessControl.userType === 'admin') {
    return <>{children}</>;
  }

  // Vérification 1: Abonnement actif requis
  if (requireActiveSubscription && !accessControl.hasActiveSubscription) {
    return renderFallback('subscription');
  }

  // Vérification 2: KYC complet requis
  if (requireKycComplete && !accessControl.kycComplete) {
    return renderFallback('kyc');
  }

  // Vérification 3: Quota disponible requis
  if (requireQuotaAvailable) {
    const quotaAvailable = accessControl.quotaStatus[requireQuotaAvailable]?.available;
    if (!quotaAvailable) {
      return renderFallback('quota', requireQuotaAvailable);
    }
  }

  // Toutes les vérifications passées - afficher le contenu
  return <>{children}</>;

  // Helper pour afficher le fallback approprié
  function renderFallback(reason: 'subscription' | 'kyc' | 'quota', quotaType?: QuotaRequirement) {
    // Fallback personnalisé
    if (fallback === 'custom' && customFallback) {
      return <>{customFallback}</>;
    }

    // Redirection
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }

    // Afficher le composant de fallback approprié
    switch (reason) {
      case 'subscription':
        return (
          <PaywallOverlay
            userType={effectiveUserType}
            title={paywallTitle}
            description={paywallDescription}
            showTrialOption={effectiveUserType === 'partner' && accessControl.subscriptionStatus === 'none'}
          />
        );

      case 'kyc':
        return (
          <KycRequiredCard
            documentsRequired={accessControl.documentsRequired}
            documentsUploaded={accessControl.documentsUploaded}
            kycStatus={accessControl.kycStatus}
          />
        );

      case 'quota':
        if (quotaType) {
          const quotaInfo = accessControl.quotaStatus[quotaType];
          return (
            <QuotaExhaustedAlert
              quotaType={quotaType}
              quotaInfo={quotaInfo}
            />
          );
        }
        // Fallback to paywall if quota type not specified
        return (
          <PaywallOverlay
            userType={effectiveUserType}
            title="Quota atteint"
            description="Vous avez atteint la limite de votre plan actuel."
          />
        );

      default:
        return (
          <PaywallOverlay
            userType={effectiveUserType}
            title={paywallTitle}
            description={paywallDescription}
          />
        );
    }
  }
}

// Export des sous-composants pour usage direct si nécessaire
export { PaywallOverlay } from './PaywallOverlay';
export { KycRequiredCard } from './KycRequiredCard';
export { QuotaExhaustedAlert } from './QuotaExhaustedAlert';
