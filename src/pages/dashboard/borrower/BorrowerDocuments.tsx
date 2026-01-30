import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { useBorrowerDocuments, type BorrowerDocument } from "@/hooks/useBorrowerData";
import { ShareResultDialog } from "@/components/borrower/ShareResultDialog";
import { CertificateStatusBar } from "@/components/borrower/CertificateStatusBar";
import { PurchaseCertificateDialog } from "@/components/borrower/PurchaseCertificateDialog";
import { useBorrowerCertificate } from "@/hooks/useBorrowerCertificate";
import { useKyc } from "@/hooks/useKyc";
import { useBorrowerProofStatus } from "@/hooks/useBorrowerProofStatus";
import { SubscriptionGuard } from "@/components/guards/SubscriptionGuard";
import { toast } from "sonner";
// Sub-components
import { 
  DocumentUploadGrid, 
  DocumentsList, 
  PlanContextBanner, 
  DocumentViewDialog,
  SubmitDossierCard 
} from "./components";

const DOCUMENT_TYPES = [
  { type: 'identity', label: 'Pièce d\'identité', description: 'CNI, Passeport ou Permis de conduire', required: true },
  { type: 'address', label: 'Justificatif de domicile', description: 'Facture d\'électricité, eau ou téléphone', required: true },
  { type: 'income', label: 'Justificatif de revenus', description: 'Fiche de paie ou relevé bancaire', required: false },
  { type: 'other', label: 'Autres documents', description: 'Documents complémentaires', required: false },
];

const BorrowerDocuments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, isLoading: certificateLoading, recertify, isRecertifying } = useBorrowerCertificate();
  const { data: documents, isLoading: docsLoading, refetch: refetchDocs } = useBorrowerDocuments();
  const { uploadDocument, deleteDocument, isUploading, uploadProgress } = useKyc();
  const { refetch: refetchProofStatus } = useBorrowerProofStatus();
  
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [viewDocument, setViewDocument] = useState<BorrowerDocument | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [highlightedDocType, setHighlightedDocType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const isLoading = certificateLoading || docsLoading;
  const hasVerifiedDocs = documents?.some(d => d.status === 'verified');
  const hasSmileIdVerification = status.plan?.smileIdIncluded && status.plan.smileIdIncluded !== 'none';
  const isDiscoveryPlan = status.plan?.id === 'emprunteur-decouverte';

  // Handle action query params from ProofProgressIndicator
  useEffect(() => {
    const action = searchParams.get('action');
    if (action && !isLoading) {
      // Clear the action param to prevent re-triggering
      setSearchParams({}, { replace: true });
      
      switch (action) {
        case 'upload-ussd':
          setHighlightedDocType('other');
          toast.info('Capturez votre écran USSD Mobile Money et téléchargez-le ci-dessous');
          // Scroll to the upload section
          setTimeout(() => {
            document.getElementById('upload-grid')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          break;
        case 'analyze-sms':
          toast.info('Téléchargez une capture d\'écran de vos SMS de transactions Mobile Money');
          setHighlightedDocType('other');
          setTimeout(() => {
            document.getElementById('upload-grid')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          break;
        case 'upload-identity':
          setHighlightedDocType('identity');
          toast.info('Téléchargez votre pièce d\'identité pour vérification OCR');
          setTimeout(() => {
            document.getElementById('upload-grid')?.scrollIntoView({ behavior: 'smooth' });
            // Auto-trigger file input
            if (fileInputRefs.current['identity']) {
              fileInputRefs.current['identity']?.click();
            }
          }, 100);
          break;
        default:
          break;
      }
    }
  }, [searchParams, isLoading, setSearchParams]);

  const handleSubmitDossier = () => {
    recertify(undefined, {
      onSuccess: (data) => {
        const score = data?.certificate?.score;
        if (score) {
          toast.success(`Certificat généré avec succès ! Score: ${score}/100`);
        } else {
          toast.success('Certificat généré avec succès !');
        }
        navigate('/dashboard/borrower/score');
      },
      onError: (error) => {
        toast.error(error?.message || 'Erreur lors de la génération du certificat');
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedDocType(docType);
    const result = await uploadDocument(file, docType);
    if (result) {
      // Refetch documents and proof status after successful upload
      await Promise.all([refetchDocs(), refetchProofStatus()]);
    }
    setSelectedDocType(null);
    e.target.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    
    const success = await deleteDocument(docId);
    if (success) {
      // Refetch documents and proof status after deletion
      await Promise.all([refetchDocs(), refetchProofStatus()]);
    }
  };

  return (
    <DashboardLayout role="borrower" title="Preuves Documentaires">
      <SubscriptionGuard
        requireActiveSubscription
        userType="borrower"
        fallback="paywall"
        paywallTitle="Accédez à vos preuves documentaires"
        paywallDescription="Souscrivez à un plan pour télécharger et gérer vos documents de solvabilité."
      >
        <div className="space-y-6">
          {/* Certificate Status Bar */}
          <CertificateStatusBar />

          {/* Plan Context Banner */}
          <PlanContextBanner
            hasSubscription={status.hasSubscription}
            isDiscoveryPlan={isDiscoveryPlan}
            hasSmileIdVerification={hasSmileIdVerification}
            onPurchase={() => setShowPurchaseDialog(true)}
          />

          {/* Document Upload Grid */}
          <DocumentUploadGrid
            documentTypes={DOCUMENT_TYPES}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            selectedDocType={selectedDocType}
            highlightedDocType={highlightedDocType}
            onFileSelect={handleFileSelect}
            fileInputRefs={fileInputRefs}
          />

          {/* Documents List */}
          <DocumentsList
            documents={documents}
            isLoading={isLoading}
            hasVerifiedDocs={hasVerifiedDocs ?? false}
            hasActiveCertificate={status.hasActiveCertificate}
            onView={setViewDocument}
            onDelete={handleDelete}
          />

          {/* Submit Dossier Card */}
          <SubmitDossierCard
            documents={documents || []}
            hasSubscription={status.hasSubscription}
            isRecertifying={isRecertifying}
            onSubmit={handleSubmitDossier}
            onPurchase={() => setShowPurchaseDialog(true)}
          />

          {/* Document Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Exigences des documents</CardTitle>
              <CardDescription>
                Assurez-vous que vos documents respectent ces critères pour une validation optimale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Format accepté</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDF, JPG, PNG</li>
                    <li>• Taille maximale : 5 MB</li>
                    <li>• Résolution minimale : 300 DPI</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Qualité requise</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Document lisible et non flou</li>
                    <li>• Toutes les informations visibles</li>
                    <li>• Document non expiré</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info about certificate benefits */}
          {status.hasActiveCertificate && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Vos documents renforcent votre certificat</h4>
                    <p className="text-sm text-muted-foreground">
                      Chaque document vérifié augmente la confiance des partenaires financiers dans votre profil.
                      Un dossier complet (identité + domicile + revenus) maximise vos chances d'obtenir un prêt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <PurchaseCertificateDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
        />

        {showShareDialog && status.certificate && (
          <ShareResultDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            resultType="score"
            resultId={status.certificate.id}
            resultSummary={{
              score: status.certificate.score ?? undefined
            }}
          />
        )}

        {/* View Document Dialog */}
        <DocumentViewDialog
          document={viewDocument}
          onClose={() => setViewDocument(null)}
        />
      </SubscriptionGuard>
    </DashboardLayout>
  );
};

export default BorrowerDocuments;
