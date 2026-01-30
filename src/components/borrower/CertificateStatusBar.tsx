import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  ChevronRight 
} from 'lucide-react';
import { useBorrowerCertificate } from '@/hooks/useBorrowerCertificate';
import { PurchaseCertificateDialog } from './PurchaseCertificateDialog';

export function CertificateStatusBar() {
  const { status, isLoading, recertify, isRecertifying } = useBorrowerCertificate();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  if (isLoading) return null;

  // No subscription - prompt to get certified
  if (!status.hasSubscription && !status.hasActiveCertificate) {
    return (
      <>
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-4 py-2">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                Obtenez votre certificat de solvabilité pour accéder aux offres de crédit
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowPurchaseDialog(true)}
              className="shrink-0"
            >
              Se certifier
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        <PurchaseCertificateDialog 
          open={showPurchaseDialog} 
          onOpenChange={setShowPurchaseDialog} 
        />
      </>
    );
  }

  // Expired certificate
  if (status.isExpired) {
    return (
      <>
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-destructive font-medium">
                Votre certificat a expiré
              </span>
            </div>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => setShowPurchaseDialog(true)}
              className="shrink-0"
            >
              Renouveler
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        <PurchaseCertificateDialog 
          open={showPurchaseDialog} 
          onOpenChange={setShowPurchaseDialog} 
        />
      </>
    );
  }

  // Expiring soon (less than 7 days)
  if (status.isExpiringSoon) {
    return (
      <>
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">
                Votre certificat expire dans <strong>{status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''}</strong>
              </span>
              {status.canRecertify && status.recertificationsRemaining !== null && (
                <Badge variant="outline" className="text-xs">
                  {status.recertificationsRemaining} recertification{status.recertificationsRemaining > 1 ? 's' : ''} restante{status.recertificationsRemaining > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {status.canRecertify && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => recertify()}
                  disabled={isRecertifying}
                  className="shrink-0"
                >
                  {isRecertifying ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Recertifier
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => setShowPurchaseDialog(true)}
                className="shrink-0"
              >
                Renouveler
              </Button>
            </div>
          </div>
        </div>
        <PurchaseCertificateDialog 
          open={showPurchaseDialog} 
          onOpenChange={setShowPurchaseDialog} 
        />
      </>
    );
  }

  // Active certificate - show minimal status
  if (status.hasActiveCertificate) {
    return (
      <div className="bg-emerald-500/5 border-b border-emerald-500/10 px-4 py-1.5">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400">
              Certificat actif • {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
            </span>
            {status.certificate?.score && (
              <Badge variant="secondary" className="text-xs">
                Score: {status.certificate.score}/100
              </Badge>
            )}
          </div>
          <Link 
            to="/dashboard/borrower/score"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir détails
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
