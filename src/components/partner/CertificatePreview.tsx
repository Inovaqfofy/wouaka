import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CertificationBadge } from '@/components/trust/CertificationBadge';

interface CertificatePreviewProps {
  preview: {
    id: string;
    borrowerName: string;
    score: number;
    grade: string;
    trustLevel: string;
    validUntil: string;
    validationStatus: 'unvalidated' | 'validated' | 'rejected';
    validatedByPartnerName?: string;
    isExpired: boolean;
    createdAt: string;
  };
}

export const CertificatePreview = ({ preview }: CertificatePreviewProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 700) return 'text-green-600';
    if (score >= 550) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{preview.borrowerName}</CardTitle>
              <CardDescription>Certificat emprunteur</CardDescription>
            </div>
          </div>
          <CertificationBadge 
            level={preview.validationStatus === 'validated' ? 'institutional' : 'self_declared'} 
            size="sm"
            institutionName={preview.validatedByPartnerName}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score et Grade */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(preview.score)}`}>
                {preview.score}
              </p>
            </div>
          </div>
          <Badge className={`text-lg px-3 py-1 ${getGradeColor(preview.grade)}`}>
            Grade {preview.grade}
          </Badge>
        </div>

        {/* Statut et dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Généré le</span>
            </div>
            <p className="text-sm font-medium">
              {format(new Date(preview.createdAt), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Expire le</span>
            </div>
            <p className={`text-sm font-medium ${preview.isExpired ? 'text-red-600' : ''}`}>
              {format(new Date(preview.validUntil), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Alertes */}
        {preview.isExpired && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-400">
            <XCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Ce certificat est expiré</p>
          </div>
        )}

        {preview.validationStatus === 'validated' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-green-700 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              Déjà validé par {preview.validatedByPartnerName || 'une institution'}
            </p>
          </div>
        )}

        {preview.validationStatus === 'rejected' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-400">
            <XCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Ce certificat a été rejeté</p>
          </div>
        )}

        {preview.validationStatus === 'unvalidated' && !preview.isExpired && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">Certificat auto-déclaré</p>
              <p className="text-xs">Validez pour accéder au dossier complet</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
