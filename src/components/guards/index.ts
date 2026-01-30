/**
 * Guards centralisés pour le contrôle d'accès
 * 
 * Usage:
 * ```tsx
 * import { SubscriptionGuard, KycGuard, PaywallOverlay } from '@/components/guards';
 * 
 * // Dans App.tsx ou une route
 * <SubscriptionGuard requireActiveSubscription fallback="paywall">
 *   <PremiumContent />
 * </SubscriptionGuard>
 * 
 * // Pour les vérifications KYC
 * <KycGuard requiredLevel="verified" fallback="card">
 *   <VerifiedContent />
 * </KycGuard>
 * ```
 */

export { SubscriptionGuard, PaywallOverlay, KycRequiredCard, QuotaExhaustedAlert } from './SubscriptionGuard';
export { KycGuard } from './KycGuard';

// Re-export types from useAccessControl for convenience
export type { AccessControlResult, SubscriptionStatus, KycStatus, UserType, QuotaStatus } from '@/hooks/useAccessControl';
