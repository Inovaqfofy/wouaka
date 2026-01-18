import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FileCheck,
  ArrowRight,
  Loader2,
  Shield,
  FileText,
  Building2,
  Info
} from 'lucide-react';
import { useValidateCertificateWeb } from '@/hooks/useValidateCertificateWeb';
import { CertificatePreview } from '@/components/partner/CertificatePreview';
import { QuotaIndicator } from '@/components/dashboard/QuotaIndicator';

const PartnerValidateCertificate = () => {
  const navigate = useNavigate();
  const [shareCode, setShareCode] = useState('');
  const { 
    isSearching, 
    isValidating, 
    preview, 
    validationResult, 
    lookupCertificate, 
    validateCertificate,
    reset
  } = useValidateCertificateWeb();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareCode.trim()) return;
    await lookupCertificate(shareCode);
  };

  const handleValidate = async () => {
    if (!preview) return;
    const result = await validateCertificate(preview.id);
    if (result?.success && result.validationStatus === 'validated') {
      // Optionnel: rediriger vers le dossier de preuves
    }
  };

  const handleReset = () => {
    setShareCode('');
    reset();
  };

  return (
    <DashboardLayout role="partner" title="Valider un Certificat">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-7 h-7 text-primary" />
            Valider un Certificat Emprunteur
          </h1>
          <p className="text-muted-foreground">
            Entrez le code de partage fourni par un emprunteur pour accéder à son dossier de preuves complet.
          </p>
        </div>

        {/* Quota indicator */}
        <QuotaIndicator />

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5" />
              Rechercher un certificat
            </CardTitle>
            <CardDescription>
              Le code de partage est composé de 8 caractères alphanumériques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="shareCode" className="sr-only">Code de partage</Label>
                <Input
                  id="shareCode"
                  placeholder="Ex: AB12CD34"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-wider uppercase"
                  maxLength={8}
                  disabled={isSearching || !!validationResult}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!shareCode.trim() || isSearching || !!validationResult}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Rechercher</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isSearching && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate Preview */}
        {preview && !validationResult && (
          <div className="space-y-4">
            <CertificatePreview preview={preview} />

            {/* Info panel */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Aperçu limité</AlertTitle>
              <AlertDescription>
                Cet aperçu montre uniquement le score et le grade. Validez le certificat pour accéder au dossier complet avec :
                screening AML/PEP, détail des preuves, recommandation crédit.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleValidate}
                disabled={isValidating || preview.isExpired || preview.validationStatus === 'rejected'}
                className="flex-1"
                size="lg"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider ce certificat
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Annuler
              </Button>
            </div>

            {preview.isExpired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Certificat expiré</AlertTitle>
                <AlertDescription>
                  Ce certificat n'est plus valide. L'emprunteur doit renouveler son certificat.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className="space-y-4">
            <Card className={`border-2 ${
              validationResult.validationStatus === 'validated' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                : 'border-red-500 bg-red-50 dark:bg-red-950/20'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {validationResult.validationStatus === 'validated' ? (
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {validationResult.validationStatus === 'validated' 
                        ? 'Certificat Validé ✓' 
                        : 'Certificat Rejeté'}
                    </h3>
                    <p className="text-muted-foreground">
                      {validationResult.validationStatus === 'validated'
                        ? 'Le dossier de preuves complet est maintenant disponible.'
                        : 'Le screening AML/PEP a détecté des alertes.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary of validation result */}
            {validationResult.validationStatus === 'validated' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé du dossier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">
                        {validationResult.dossier.certificate?.score || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">Score Crédit</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <Badge variant={validationResult.dossier.aml_screening?.is_clear ? 'default' : 'destructive'}>
                        {validationResult.dossier.aml_screening?.is_clear ? 'Clean' : 'Alerte'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">AML/PEP</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-lg font-bold">
                        {validationResult.dossier.credit_recommendation?.approved ? 'Oui' : 'Non'}
                      </p>
                      <p className="text-xs text-muted-foreground">Recommandé</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-lg font-bold">
                        {validationResult.dossier.credit_recommendation?.max_amount 
                          ? `${(validationResult.dossier.credit_recommendation.max_amount / 1000000).toFixed(1)}M`
                          : '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">Montant Max (FCFA)</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <Button asChild className="flex-1">
                      <Link to={`/dashboard/partner/evaluations`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Voir le dossier complet
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Nouvelle validation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {validationResult.validationStatus === 'rejected' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Raisons du rejet :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {validationResult.dossier.aml_screening?.pep_detected && (
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Personne politiquement exposée (PEP) détectée
                        </li>
                      )}
                      {validationResult.dossier.aml_screening?.sanctions_matches?.length > 0 && (
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Correspondance dans les listes de sanctions
                        </li>
                      )}
                      {!validationResult.dossier.aml_screening?.is_clear && (
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Niveau de risque: {validationResult.dossier.aml_screening?.risk_level || 'Élevé'}
                        </li>
                      )}
                    </ul>
                    <Button variant="outline" onClick={handleReset} className="mt-4">
                      Nouvelle recherche
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Help section */}
        {!preview && !validationResult && !isSearching && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Comment ça marche ?</h4>
                  <ol className="mt-2 text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      L'emprunteur génère son certificat sur Wouaka et vous partage son code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      Vous saisissez le code ci-dessus pour voir un aperçu limité
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      Vous cliquez "Valider" pour lancer le screening AML/PEP et accéder au dossier complet
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">4.</span>
                      Le certificat est marqué "Validé par [Votre Institution]" avec valeur juridique
                    </li>
                  </ol>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Chaque validation consomme 1 quota de votre abonnement</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerValidateCertificate;
