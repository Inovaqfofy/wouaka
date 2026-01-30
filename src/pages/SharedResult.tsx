import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Info,
  QrCode,
  LogIn
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoWouaka from '@/assets/logo-wouaka.png';
import { CertificationBadge } from '@/components/trust/CertificationBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface SharedResult {
  id: string;
  borrower_id: string;
  result_type: 'score' | 'kyc';
  result_id: string;
  share_token: string;
  is_accessed: boolean;
  expires_at: string;
  created_at: string;
}

interface ScoreResult {
  score: number;
  grade: string;
  risk_category: string;
  confidence: number;
  created_at: string;
}

interface KycResult {
  status: string;
  full_name: string;
  identity_score: number;
  fraud_score: number;
  risk_level: string;
  created_at: string;
}

const SharedResult = () => {
  const { token } = useParams<{ token: string }>();
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedResult, setSharedResult] = useState<SharedResult | null>(null);
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [kycData, setKycData] = useState<KycResult | null>(null);

  useEffect(() => {
    const fetchSharedResult = async () => {
      if (!token) {
        setError('Token invalide');
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer le résultat partagé
        const { data: shared, error: sharedError } = await supabase
          .from('borrower_shared_results')
          .select('*')
          .eq('share_token', token)
          .single();

        if (sharedError || !shared) {
          setError('Lien de partage invalide ou expiré');
          setIsLoading(false);
          return;
        }

        // Vérifier l'expiration
        if (new Date(shared.expires_at) < new Date()) {
          setError('Ce lien de partage a expiré');
          setIsLoading(false);
          return;
        }

        setSharedResult(shared as SharedResult);

        // Marquer comme accédé
        if (!shared.is_accessed) {
          await supabase
            .from('borrower_shared_results')
            .update({ is_accessed: true, accessed_at: new Date().toISOString() })
            .eq('id', shared.id);
        }

        // Récupérer les données selon le type
        if (shared.result_type === 'score') {
          const { data: score } = await supabase
            .from('scoring_requests')
            .select('score, grade, risk_category, confidence, created_at')
            .eq('id', shared.result_id)
            .single();

          if (score) {
            setScoreData(score as ScoreResult);
          }
        } else {
          const { data: kyc } = await supabase
            .from('kyc_requests')
            .select('status, full_name, identity_score, fraud_score, risk_level, created_at')
            .eq('id', shared.result_id)
            .single();

          if (kyc) {
            setKycData(kyc as KycResult);
          }
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedResult();
  }, [token]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 55) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle>Lien invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src={logoWouaka} alt="Wouaka" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">
            {sharedResult?.result_type === 'score' ? 'Score de Crédit Partagé' : 'Vérification KYC Partagée'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Ce résultat a été partagé par un emprunteur via Wouaka
          </p>
          {/* Badge Auto-déclaré */}
          <div className="mt-4 flex justify-center">
            <CertificationBadge level="self_declared" size="lg" />
          </div>
        </div>

        {/* Avertissement B2B - Info limitée */}
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Aperçu limité</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Ce certificat auto-déclaré fournit un aperçu indicatif. Pour un dossier de preuves complet 
            avec screening AML/PEP et valeur juridique, utilisez l'API Wouaka Partenaires.
          </AlertDescription>
        </Alert>

        {/* Score Result - Informations limitées */}
        {sharedResult?.result_type === 'score' && scoreData && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Score de Solvabilité WOUAKA</CardTitle>
              <CardDescription>Score de crédit indicatif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score principal - LIMITÉ: seulement score et grade */}
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <div className={`text-6xl font-bold ${getScoreColor(scoreData.score)}`}>
                  {scoreData.score}
                </div>
                <div className="text-xl font-semibold mt-2">
                  Grade: {scoreData.grade}
                </div>
              </div>

              {/* Date seulement - PAS de confiance ni détails */}
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Calculé le</p>
                <p className="text-lg font-semibold">
                  {format(new Date(scoreData.created_at), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>

              {/* Message pour accès complet */}
              <div className="p-4 border border-dashed rounded-lg text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Coefficient de certitude</strong>, <strong>catégorie de risque</strong> et <strong>recommandation crédit</strong> disponibles via l'API Partenaires.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KYC Result - Informations limitées */}
        {sharedResult?.result_type === 'kyc' && kycData && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Certificat d'Identité WOUAKA</CardTitle>
              <CardDescription>Vérification d'identité indicative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statut principal - LIMITÉ */}
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {getStatusIcon(kycData.status)}
                  <span className="text-2xl font-bold capitalize">
                    {kycData.status === 'verified' ? 'Vérifié' : 
                     kycData.status === 'pending' ? 'En attente' :
                     kycData.status === 'rejected' ? 'Rejeté' : kycData.status}
                  </span>
                </div>
                {/* NE PAS afficher le nom complet - protection données */}
                <p className="text-sm text-muted-foreground">Identité vérifiée</p>
              </div>

              {/* Date seulement - PAS de scores détaillés */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Vérifié le {format(new Date(kycData.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>

              {/* Message pour accès complet */}
              <div className="p-4 border border-dashed rounded-lg text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Score d'identité</strong>, <strong>score de fraude</strong>, <strong>AML/PEP screening</strong> et <strong>documents</strong> disponibles via l'API Partenaires.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA pour institutions */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Vous êtes une institution financière ?</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Validez ce certificat via Wouaka pour obtenir :
                </p>
                <ul className="mt-3 text-sm space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Dossier de preuves complet et auditable
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Screening AML/PEP obligatoire BCEAO
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Recommandation crédit personnalisée
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Protection juridique et conformité
                  </li>
                </ul>
                <div className="flex flex-wrap gap-3 mt-4">
                  {/* CTA adaptatif selon l'état de connexion */}
                  {user && (role === 'PARTENAIRE' || role === 'SUPER_ADMIN') ? (
                    <Button asChild>
                      <Link to="/dashboard/partner/validate">
                        <QrCode className="w-4 h-4 mr-2" />
                        Valider dans mon dashboard
                      </Link>
                    </Button>
                  ) : user ? (
                    <Button asChild>
                      <Link to="/pricing#partenaire">
                        Devenir Partenaire
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild>
                        <Link to="/auth?redirect=/dashboard/partner/validate">
                          <LogIn className="w-4 h-4 mr-2" />
                          Se connecter (Partenaire)
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/pricing#partenaire">
                          Devenir Partenaire
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button variant="outline" asChild>
                    <Link to="/api-docs">
                      Documentation API
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Ce certificat auto-déclaré a une valeur indicative uniquement.
            <br />
            Seule une validation institutionnelle via l'API Wouaka offre une protection juridique.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/">
              Découvrir Wouaka
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedResult;
