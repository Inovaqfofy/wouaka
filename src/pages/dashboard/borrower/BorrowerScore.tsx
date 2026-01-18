import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShieldCheck, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Info,
  Lightbulb,
  Coins,
  Share2,
  Calculator,
  Target,
  FileCheck,
  Smartphone,
  MessageSquare,
  Users,
  Clock,
  RefreshCw,
  Calendar,
  Infinity
} from "lucide-react";
import { useBorrowerCertificate } from "@/hooks/useBorrowerCertificate";
import { useBorrowerScore } from "@/hooks/useBorrowerData";
import { PurchaseCertificateDialog } from "@/components/borrower/PurchaseCertificateDialog";
import { ShareResultDialog } from "@/components/borrower/ShareResultDialog";
import { TrustLevelBadge, getTrustLevelFromScore } from "@/components/trust";
import { ProofProgressIndicator, ProofStatus } from "@/components/trust";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatValidityPeriod, formatRecertifications } from "@/lib/borrower-pricing";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BorrowerScore = () => {
  const { profile } = useAuth();
  const { status, certificate, isLoading: certLoading, recertify, isRecertifying } = useBorrowerCertificate();
  const { data: scoreData, isLoading: scoreLoading } = useBorrowerScore();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isLoading = certLoading || scoreLoading;
  // Use certificate data or fallback to score data
  const score = certificate?.score || scoreData?.score;
  const certaintyCoefficient = certificate?.certainty_coefficient || scoreData?.confidence || 0;

  // Proof status - would come from user data in production
  const proofStatus: ProofStatus = {
    otpVerified: !!profile?.phone,
    ussdUploaded: false,
    smsAnalyzed: false,
    documentsVerified: false,
    guarantorAdded: false,
  };

  const trustLevel = score ? getTrustLevelFromScore(score) : 'unverified';

  // Proof sources with weights
  const proofSources = [
    { 
      name: "Certification OTP", 
      source: "Téléphone certifié", 
      weight: 0.9, 
      icon: Smartphone,
      verified: proofStatus.otpVerified 
    },
    { 
      name: "Profil Mobile Money", 
      source: "Capture USSD", 
      weight: 0.85, 
      icon: FileCheck,
      verified: proofStatus.ussdUploaded 
    },
    { 
      name: "Transactions SMS", 
      source: "Analyse locale", 
      weight: 0.9, 
      icon: MessageSquare,
      verified: proofStatus.smsAnalyzed 
    },
    { 
      name: "Documents d'identité", 
      source: "OCR vérifié", 
      weight: 0.8, 
      icon: FileCheck,
      verified: proofStatus.documentsVerified 
    },
    { 
      name: "Garant", 
      source: "Capital social", 
      weight: 0.7, 
      icon: Users,
      verified: proofStatus.guarantorAdded 
    },
  ];

  const tips = [
    "Certifiez votre numéro par OTP pour obtenir un coefficient de 0.9",
    "Capturez votre profil Mobile Money (USSD) pour prouver votre ancienneté",
    "Autorisez l'analyse locale de vos SMS pour maximiser votre score",
    "Ajoutez un garant pour valoriser votre capital social",
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'border-emerald-500 text-emerald-600';
    if (score >= 55) return 'border-amber-500 text-amber-600';
    return 'border-red-500 text-red-600';
  };

  return (
    <DashboardLayout role="borrower" title="Mon Certificat de Solvabilité">
      <div className="space-y-6">
        {/* Certificate Status Banner */}
        {status.hasActiveCertificate && certificate && (
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
                      onClick={() => recertify()}
                      disabled={isRecertifying}
                    >
                      {isRecertifying ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Recertifier
                      {status.recertificationsRemaining !== null && (
                        <Badge variant="secondary" className="ml-2">
                          {status.recertificationsRemaining} restante{status.recertificationsRemaining > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {certificate.share_code && (
                    <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Mon Certificat de Solvabilité
                  </CardTitle>
                  <CardDescription>
                    Score basé sur vos preuves vérifiables avec coefficient de certitude
                  </CardDescription>
                </div>
                {score && (
                  <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Skeleton className="w-48 h-48 rounded-full" />
                </div>
              ) : score ? (
                <div className="flex flex-col items-center">
                  <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center ${getScoreColor(score)}`}>
                    <div className="text-center">
                      <span className="text-4xl font-bold">{score}</span>
                      <p className="text-xs text-muted-foreground">/100</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center space-y-2">
                    <TrustLevelBadge level={trustLevel} size="lg" />
                    
                    {/* Certainty Coefficient Display */}
                    <div className="flex items-center justify-center gap-2 p-3 bg-secondary/10 rounded-lg">
                      <Target className="w-5 h-5 text-secondary" />
                      <span className="text-sm font-medium">Coefficient de certitude :</span>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {Math.round(certaintyCoefficient * 100)}%
                      </Badge>
                    </div>
                    
                    {certificate && (
                      <p className="text-sm text-muted-foreground">
                        Certificat créé le {format(new Date(certificate.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              ) : !status.hasSubscription ? (
                // No subscription - prompt to subscribe
                <div className="text-center py-12">
                  <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Obtenez votre certificat</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Choisissez un plan pour obtenir votre certificat de solvabilité avec partage illimité vers les institutions financières.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => setShowPurchaseDialog(true)}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Choisir un plan
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/pricing">
                        Voir les tarifs
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                // Has subscription but no score yet
                <div className="text-center py-12">
                  <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Calculator className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Générer votre certificat</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Vous avez un abonnement actif. Fournissez vos preuves pour générer votre certificat.
                  </p>
                  <Button asChild>
                    <Link to="/dashboard/borrower/profile">
                      Fournir mes preuves
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score History & Certainty Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                Coefficient de Certitude
              </CardTitle>
              <CardDescription>Fiabilité de vos preuves</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-4xl font-bold text-secondary">
                    {Math.round(certaintyCoefficient * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Coefficient global
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Preuves vérifiées</span>
                    <span className="font-medium">Poids 0.9</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Données déclaratives</span>
                    <span className="font-medium">Poids 0.3</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t text-xs text-muted-foreground">
                  <Info className="w-4 h-4 inline mr-1" />
                  Plus vos preuves sont vérifiables, plus le coefficient est élevé.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proof Sources - Only show if score exists */}
        {score && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Sources de vos preuves
              </CardTitle>
              <CardDescription>
                Les preuves vérifiables qui composent votre score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proofSources.map((source, index) => {
                  const Icon = source.icon;
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg ${
                        source.verified 
                          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${source.verified ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          <span className="font-medium text-sm">{source.name}</span>
                        </div>
                        {source.verified ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="outline">Non fourni</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{source.source}</span>
                        <span className="text-xs font-semibold text-secondary">
                          Poids: {source.weight}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProofProgressIndicator 
            proofStatus={proofStatus} 
            showActions={true}
          />

          {/* Tips to Improve */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Renforcer mes preuves
              </CardTitle>
              <CardDescription>
                Actions pour améliorer votre coefficient de certitude
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <div className="w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-200">{index + 1}</span>
                    </div>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <PurchaseCertificateDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
      />

      {score && certificate && (
        <ShareResultDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          resultType="score"
          resultId={certificate.id}
          resultSummary={{
            score: certificate.score || 0,
            grade: certificate.trust_level || 'bronze'
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default BorrowerScore;
