import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Lightbulb,
  Share2,
  FileCheck,
  Smartphone,
  MessageSquare,
  Users
} from "lucide-react";
import { useBorrowerCertificate } from "@/hooks/useBorrowerCertificate";
import { useBorrowerScore } from "@/hooks/useBorrowerData";
import { useBorrowerProofStatus } from "@/hooks/useBorrowerProofStatus";
import { ShareResultDialog } from "@/components/borrower/ShareResultDialog";
import { getTrustLevelFromScore } from "@/components/trust";
import { ProofProgressIndicator } from "@/components/trust";
import { SubscriptionGuard } from "@/components/guards/SubscriptionGuard";

// Sub-components for better organization
import { CertificateStatusBanner } from "./components/CertificateStatusBanner";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { CertaintyCard } from "./components/CertaintyCard";
import { ProofSourcesCard } from "./components/ProofSourcesCard";

const BorrowerScore = () => {
  const { status, certificate, isLoading: certLoading, recertify, isRecertifying } = useBorrowerCertificate();
  const { data: scoreData, isLoading: scoreLoading } = useBorrowerScore();
  const { proofStatus, isLoading: proofLoading } = useBorrowerProofStatus();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isLoading = certLoading || scoreLoading || proofLoading;
  const score = certificate?.score || scoreData?.score;
  const certaintyCoefficient = certificate?.certainty_coefficient || scoreData?.confidence || 0;

  const trustLevel = score ? getTrustLevelFromScore(score) : 'unverified';

  const proofSources = [
    { name: "Certification OTP", source: "Téléphone certifié", weight: 0.9, icon: Smartphone, verified: proofStatus.otpVerified },
    { name: "Profil Mobile Money", source: "Capture USSD", weight: 0.85, icon: FileCheck, verified: proofStatus.ussdUploaded },
    { name: "Transactions SMS", source: "Analyse locale", weight: 0.9, icon: MessageSquare, verified: proofStatus.smsAnalyzed },
    { name: "Documents d'identité", source: "OCR vérifié", weight: 0.8, icon: FileCheck, verified: proofStatus.documentsVerified },
    { name: "Garant", source: "Capital social", weight: 0.7, icon: Users, verified: proofStatus.guarantorAdded },
  ];

  const tips = [
    "Certifiez votre numéro par OTP pour obtenir un coefficient de 0.9",
    "Capturez votre profil Mobile Money (USSD) pour prouver votre ancienneté",
    "Autorisez l'analyse locale de vos SMS pour maximiser votre score",
    "Ajoutez un garant pour valoriser votre capital social",
  ];

  return (
    <DashboardLayout role="borrower" title="Mon Certificat de Solvabilité">
      <SubscriptionGuard
        requireActiveSubscription
        userType="borrower"
        fallback="paywall"
        paywallTitle="Accédez à votre certificat de solvabilité"
        paywallDescription="Souscrivez à un plan pour obtenir votre certificat et le partager avec les institutions financières."
      >
        <div className="space-y-6">
          {/* Certificate Status Banner */}
          {status.hasActiveCertificate && certificate && (
            <CertificateStatusBanner
              certificate={certificate}
              status={status}
              isRecertifying={isRecertifying}
              onRecertify={recertify}
              onShare={() => setShowShareDialog(true)}
            />
          )}

          {/* Score Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <ScoreDisplay
                  isLoading={isLoading}
                  score={score}
                  trustLevel={trustLevel}
                  certaintyCoefficient={certaintyCoefficient}
                  certificate={certificate}
                  hasSubscription={status.hasSubscription}
                />
              </CardContent>
            </Card>

            <CertaintyCard certaintyCoefficient={certaintyCoefficient} />
          </div>

          {/* Proof Sources */}
          {score && (
            <ProofSourcesCard proofSources={proofSources} />
          )}

          {/* Proof Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProofProgressIndicator proofStatus={proofStatus} showActions={true} />

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

        {/* Share Dialog */}
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
      </SubscriptionGuard>
    </DashboardLayout>
  );
};

export default BorrowerScore;
