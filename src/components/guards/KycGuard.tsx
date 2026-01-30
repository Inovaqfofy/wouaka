import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { KycRequiredCard } from './KycRequiredCard';

type FallbackBehavior = 'redirect' | 'card' | 'custom';

interface KycGuardProps {
  children: React.ReactNode;
  
  // Comportement de fallback
  fallback?: FallbackBehavior;
  redirectTo?: string;
  customFallback?: React.ReactNode;
  
  // Afficher le loading
  showLoading?: boolean;
  
  // Niveau requis (pour extensions futures)
  requiredLevel?: 'basic' | 'verified' | 'full';
}

/**
 * Guard dédié pour protéger les fonctionnalités nécessitant un KYC complet
 * Vérifie que l'utilisateur a complété son processus de vérification d'identité
 */
export function KycGuard({
  children,
  fallback = 'card',
  redirectTo = '/dashboard/borrower/profile',
  customFallback,
  showLoading = true,
  requiredLevel = 'basic',
}: KycGuardProps) {
  const accessControl = useAccessControl();

  // Afficher le loading si nécessaire
  if (accessControl.isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification du KYC...</p>
        </div>
      </div>
    );
  }

  // Admin bypass - accès total
  if (accessControl.userType === 'admin') {
    return <>{children}</>;
  }

  // Vérifier selon le niveau requis
  const isKycSufficient = checkKycLevel(accessControl.kycStatus, requiredLevel);

  if (!isKycSufficient) {
    return renderFallback();
  }

  // KYC suffisant - afficher le contenu
  return <>{children}</>;

  function checkKycLevel(status: string, level: string): boolean {
    switch (level) {
      case 'full':
        return status === 'validated';
      case 'verified':
        return status === 'validated' || status === 'pending';
      case 'basic':
      default:
        return accessControl.documentsUploaded > 0 || status === 'validated';
    }
  }

  function renderFallback() {
    // Fallback personnalisé
    if (fallback === 'custom' && customFallback) {
      return <>{customFallback}</>;
    }

    // Redirection
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }

    // Afficher la carte KYC requise
    return (
      <KycRequiredCard
        documentsRequired={accessControl.documentsRequired}
        documentsUploaded={accessControl.documentsUploaded}
        kycStatus={accessControl.kycStatus}
      />
    );
  }
}
