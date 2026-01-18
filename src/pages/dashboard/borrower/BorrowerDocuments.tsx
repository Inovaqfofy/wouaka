import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Trash2,
  Plus,
  Share2,
  Loader2,
  ShieldCheck,
  Award,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useBorrowerDocuments, type BorrowerDocument } from "@/hooks/useBorrowerData";
import { ShareResultDialog } from "@/components/borrower/ShareResultDialog";
import { CertificateStatusBar } from "@/components/borrower/CertificateStatusBar";
import { PurchaseCertificateDialog } from "@/components/borrower/PurchaseCertificateDialog";
import { useBorrowerCertificate } from "@/hooks/useBorrowerCertificate";
import { Link } from "react-router-dom";
import { useKyc } from "@/hooks/useKyc";
import { Progress } from "@/components/ui/progress";

const BorrowerDocuments = () => {
  const { status, isLoading: certificateLoading } = useBorrowerCertificate();
  const { data: documents, isLoading: docsLoading, refetch: refetchDocs } = useBorrowerDocuments();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewDocument, setViewDocument] = useState<BorrowerDocument | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  const { uploadDocument, deleteDocument, isUploading, uploadProgress } = useKyc();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isLoading = certificateLoading || docsLoading;
  const hasVerifiedDocs = documents?.some(d => d.status === 'verified');
  
  // Check if user has Smile ID verification (Essentiel or Premium plan)
  const hasSmileIdVerification = status.plan?.smileIdIncluded && status.plan.smileIdIncluded !== 'none';
  const isDiscoveryPlan = status.plan?.id === 'emprunteur-decouverte';

  const getStatusBadge = (docStatus: string) => {
    switch (docStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Vérifié</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge variant="outline">{docStatus}</Badge>;
    }
  };

  const documentTypes = [
    { type: 'identity', label: 'Pièce d\'identité', description: 'CNI, Passeport ou Permis de conduire', required: true },
    { type: 'address', label: 'Justificatif de domicile', description: 'Facture d\'électricité, eau ou téléphone', required: true },
    { type: 'income', label: 'Justificatif de revenus', description: 'Fiche de paie ou relevé bancaire', required: false },
    { type: 'other', label: 'Autres documents', description: 'Documents complémentaires', required: false },
  ];

  const handleShare = (docId: string) => {
    setSelectedDocId(docId);
    setShowShareDialog(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedDocType(docType);
    const result = await uploadDocument(file, docType);
    if (result) {
      await refetchDocs();
    }
    setSelectedDocType(null);
    e.target.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    
    const success = await deleteDocument(docId);
    if (success) {
      await refetchDocs();
    }
  };

  const handleView = (doc: BorrowerDocument) => {
    setViewDocument(doc);
  };

  const isPdfDocument = (url: string) => {
    return url.toLowerCase().endsWith('.pdf');
  };

  return (
    <DashboardLayout role="borrower" title="Preuves Documentaires">
      <div className="space-y-6">
        {/* Certificate Status Bar */}
        <CertificateStatusBar />

        {/* Contextual Message based on plan */}
        {!status.hasSubscription ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Obtenez votre Certificat de Solvabilité</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Souscrivez à un plan pour obtenir un certificat de solvabilité reconnu par les institutions financières.
                    Les documents uploadés renforceront votre dossier de certification.
                  </p>
                  <Button onClick={() => setShowPurchaseDialog(true)}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Choisir un plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isDiscoveryPlan ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Plan Découverte - Documents Manuels</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre plan actuel ne comprend pas la vérification biométrique automatique.
                    Uploadez vos documents manuellement pour renforcer votre dossier, ou passez à un plan supérieur.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowPurchaseDialog(true)}>
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Passer au plan supérieur
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : hasSmileIdVerification && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Vérification Biométrique Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre identité a été vérifiée via Smile ID. Vous pouvez ajouter des documents supplémentaires 
                    pour enrichir votre dossier (justificatifs de revenus, domicile, etc.).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Ajouter des Preuves Documentaires
            </CardTitle>
            <CardDescription>
              Ces documents renforceront votre dossier de certification auprès des partenaires financiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documentTypes.map((docType) => (
                <div 
                  key={docType.type}
                  className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    ref={(el) => (fileInputRefs.current[docType.type] = el)}
                    onChange={(e) => handleFileSelect(e, docType.type)}
                  />
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">{docType.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{docType.description}</p>
                  {docType.required && (
                    <Badge variant="outline" className="mt-2 text-xs">Recommandé</Badge>
                  )}
                  
                  {isUploading && selectedDocType === docType.type ? (
                    <div className="mt-3 space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        {uploadProgress}%
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => fileInputRefs.current[docType.type]?.click()}
                      disabled={isUploading}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documents Soumis</CardTitle>
                <CardDescription>
                  Liste de vos documents et leur statut de vérification
                </CardDescription>
              </div>
              {hasVerifiedDocs && status.hasActiveCertificate && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/borrower/score">
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager mon certificat
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun document soumis</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez des documents pour renforcer votre dossier de certification
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type} • {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(doc.status || 'pending')}
                      <Button variant="ghost" size="icon" onClick={() => handleView(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewDocument?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewDocument?.file_url && (
              isPdfDocument(viewDocument.file_url) ? (
                <iframe 
                  src={viewDocument.file_url} 
                  className="w-full h-[500px] rounded-lg border"
                  title={viewDocument.file_name}
                />
              ) : (
                <img 
                  src={viewDocument.file_url} 
                  alt={viewDocument.file_name}
                  className="w-full max-h-[500px] object-contain rounded-lg border"
                />
              )
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Type: {viewDocument?.document_type}</span>
                {viewDocument?.created_at && (
                  <span>• Uploadé le {format(new Date(viewDocument.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                )}
              </div>
              {viewDocument?.ocr_confidence && (
                <Badge variant="outline">
                  OCR Confiance: {Math.round(viewDocument.ocr_confidence)}%
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BorrowerDocuments;
