import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Calendar, RefreshCw, Share2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CertificateStatusBannerProps {
  certificate: {
    valid_until: string;
    share_code?: string | null;
  };
  status: {
    daysRemaining: number;
    canRecertify: boolean;
    recertificationsRemaining: number | null;
  };
  isRecertifying: boolean;
  onRecertify: () => void;
  onShare: () => void;
}

export function CertificateStatusBanner({
  certificate,
  status,
  isRecertifying,
  onRecertify,
  onShare,
}: CertificateStatusBannerProps) {
  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border-emerald-500/30">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
                Certificat Actif
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expire le {format(new Date(certificate.valid_until), 'dd MMM yyyy', { locale: fr })}
                </span>
                <Badge variant="outline">
                  {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.canRecertify && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRecertify}
                disabled={isRecertifying}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRecertifying ? 'animate-spin' : ''}`} />
                Recertifier
                {status.recertificationsRemaining !== null && (
                  <Badge variant="secondary" className="ml-2">
                    {status.recertificationsRemaining} restante{status.recertificationsRemaining > 1 ? 's' : ''}
                  </Badge>
                )}
              </Button>
            )}
            {certificate.share_code && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
