import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Camera,
  CreditCard,
  User,
  Loader2,
  Clock,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoWouaka from "@/assets/logo-wouaka.png";
import { useWouakaKyc } from "@/hooks/useWouakaKyc";
import { KycSkeletonCard } from "@/components/ui/skeleton-card";
import { PublicDocumentUpload } from "@/components/kyc/PublicDocumentUpload";

interface TokenData {
  id: string;
  token: string;
  partner_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string;
  expires_at: string;
  kyc_request_id: string | null;
}

interface UploadedDocument {
  url: string;
  ocrData?: {
    text: string;
    confidence: number;
  };
}

type SubmissionStep = 'loading' | 'invalid' | 'expired' | 'intro' | 'documents' | 'analyzing' | 'success';

const requiredDocuments = [
  { 
    id: 'national_id', 
    label: 'Carte d\'identité nationale', 
    description: 'Recto et verso de votre CNI',
    icon: CreditCard 
  },
  { 
    id: 'selfie', 
    label: 'Photo selfie avec CNI', 
    description: 'Tenez votre CNI à côté de votre visage',
    icon: Camera 
  },
  { 
    id: 'proof_of_address', 
    label: 'Justificatif de domicile', 
    description: 'Facture d\'eau, électricité ou téléphone de moins de 3 mois',
    icon: FileText,
    optional: true
  },
];

const SubmitDocuments = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<SubmissionStep>('loading');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyIdentity: sdkVerifyIdentity, isLoading: kycLoading } = useWouakaKyc({ 
    persistToDatabase: false, 
    showToasts: false 
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStep('invalid');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('document_submission_tokens')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !data) {
          setStep('invalid');
          return;
        }

        // Check if token is expired
        if (new Date(data.expires_at) < new Date()) {
          setStep('expired');
          return;
        }

        // Check if already used
        if (data.status === 'used') {
          setStep('success');
          return;
        }

        setTokenData(data);
        setStep('intro');
      } catch (error) {
        console.error('Error validating token:', error);
        setStep('invalid');
      }
    };

    validateToken();
  }, [token]);

  const handleDocumentUploaded = (docId: string, fileUrl: string, ocrData?: { text: string; confidence: number }) => {
    setUploadedDocuments(prev => ({ 
      ...prev, 
      [docId]: { url: fileUrl, ocrData } 
    }));
  };

  const handleSubmit = async () => {
    if (!tokenData) return;

    setIsSubmitting(true);
    setStep('analyzing');

    try {
      // Calculate average OCR confidence
      const ocrConfidences = Object.values(uploadedDocuments)
        .filter(doc => doc.ocrData?.confidence)
        .map(doc => doc.ocrData!.confidence);
      const avgOcrConfidence = ocrConfidences.length > 0
        ? Math.round(ocrConfidences.reduce((a, b) => a + b, 0) / ocrConfidences.length)
        : null;

      // Extract OCR text from national ID if available
      const nationalIdDoc = uploadedDocuments['national_id'];
      const extractedText = nationalIdDoc?.ocrData?.text || '';

      // Mark token as used
      await supabase
        .from('document_submission_tokens')
        .update({ 
          status: 'used', 
          used_at: new Date().toISOString() 
        })
        .eq('id', tokenData.id);

      // Create or update KYC request
      let kycRequestId = tokenData.kyc_request_id;
      
      if (kycRequestId) {
        await supabase
          .from('kyc_requests')
          .update({
            status: 'processing',
            documents_submitted: Object.keys(uploadedDocuments).length,
            documents_verified: 0
          })
          .eq('id', kycRequestId);
      } else {
        // Create a new KYC request
        const { data: newKyc, error: kycError } = await supabase
          .from('kyc_requests')
          .insert({
            partner_id: tokenData.partner_id,
            full_name: tokenData.client_name,
            phone_number: tokenData.client_phone,
            status: 'processing',
            documents_submitted: Object.keys(uploadedDocuments).length,
            documents_verified: 0
          })
          .select('id')
          .single();

        if (kycError) throw kycError;
        kycRequestId = newKyc.id;
      }

      // Store document URLs in kyc_documents table
      for (const [docType, docData] of Object.entries(uploadedDocuments)) {
        await supabase.from('kyc_documents').insert({
          user_id: tokenData.partner_id, // Using partner_id as proxy
          document_type: docType,
          file_url: docData.url,
          file_name: `${tokenData.client_name}_${docType}`,
          status: 'pending',
          ocr_data: docData.ocrData ? {
            text: docData.ocrData.text,
            confidence: docData.ocrData.confidence
          } : null,
          ocr_confidence: docData.ocrData?.confidence || null
        });
      }

      // Trigger W-KYC processing via SDK
      try {
        const kycResult = await sdkVerifyIdentity({
          level: 'basic',
          full_name: tokenData.client_name,
          phone_number: tokenData.client_phone || '',
          national_id: extractedText.slice(0, 50),
          date_of_birth: '1990-01-01',
          country: 'CI',
          documents: Object.entries(uploadedDocuments).map(([type, data]) => ({
            type,
            url: data.url,
            ocr_confidence: data.ocrData?.confidence || 0
          }))
        });

        if (kycResult) {
          // Update KYC request with results
          await supabase
            .from('kyc_requests')
            .update({
              status: kycResult.status === 'verified' ? 'verified' : 
                      kycResult.status === 'rejected' ? 'rejected' : 'review',
              identity_score: kycResult.identity_score || null,
              fraud_score: kycResult.fraud_score || 0,
              risk_level: kycResult.risk_level || 'medium',
              risk_flags: kycResult.checks?.filter(c => !c.passed).map(c => c.name) || [],
              documents_verified: Object.keys(uploadedDocuments).length,
              processing_time_ms: kycResult.processing_time_ms || null,
              completed_at: new Date().toISOString()
            })
            .eq('id', kycRequestId);
        }
      } catch (kycFnError) {
        console.error('KYC processing error:', kycFnError);
        // Even if processing fails, mark as pending review
        await supabase
          .from('kyc_requests')
          .update({ status: 'review' })
          .eq('id', kycRequestId);
      }

      setStep('success');
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error("Erreur lors de la soumission. Veuillez réessayer.");
      setStep('documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredCount = requiredDocuments.filter(d => !d.optional).length;
  const uploadedCount = Object.keys(uploadedDocuments).filter(
    id => requiredDocuments.find(d => d.id === id && !d.optional)
  ).length;
  const progress = (uploadedCount / requiredCount) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoWouaka} alt="Wouaka" className="h-8" />
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Connexion sécurisée
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Loading State */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Vérification du lien...</p>
          </div>
        )}

        {/* Invalid Token */}
        {step === 'invalid' && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Lien invalide</h1>
              <p className="text-muted-foreground mb-6">
                Ce lien de soumission n'existe pas ou a été révoqué. 
                Veuillez contacter votre institution financière pour obtenir un nouveau lien.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expired Token */}
        {step === 'expired' && (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Lien expiré</h1>
              <p className="text-muted-foreground mb-6">
                Ce lien de soumission a expiré. Les liens sont valables 7 jours.
                Veuillez contacter votre institution financière pour obtenir un nouveau lien.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Introduction */}
        {step === 'intro' && tokenData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Bonjour, {tokenData.client_name}
              </h1>
              <p className="text-muted-foreground">
                Vous êtes invité(e) à soumettre vos documents d'identité pour vérification.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Processus de vérification WOUAKA
                </CardTitle>
                <CardDescription>
                  Vos documents seront analysés de manière sécurisée et confidentielle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {requiredDocuments.map((doc, index) => {
                    const Icon = doc.icon;
                    return (
                      <div key={doc.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {doc.label}
                            {doc.optional && (
                              <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    En continuant, vous acceptez que vos documents soient traités conformément à notre 
                    politique de confidentialité et aux réglementations UEMOA en vigueur.
                  </p>
                  <Button className="w-full" onClick={() => setStep('documents')}>
                    Commencer la soumission
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Document Upload */}
        {step === 'documents' && tokenData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold mb-2">Soumettre vos documents</h1>
              <p className="text-muted-foreground">
                Téléchargez les documents requis ci-dessous
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span className="font-medium">{uploadedCount}/{requiredCount} documents requis</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              {requiredDocuments.map((doc) => (
                <PublicDocumentUpload
                  key={doc.id}
                  documentId={doc.id}
                  label={doc.label}
                  description={doc.description}
                  icon={doc.icon}
                  optional={doc.optional}
                  isUploaded={!!uploadedDocuments[doc.id]}
                  onUpload={(url, ocrData) => handleDocumentUploaded(doc.id, url, ocrData)}
                  partnerId={tokenData.partner_id}
                  clientName={tokenData.client_name}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('intro')}>
                Retour
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={uploadedCount < requiredCount || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Soumettre les documents
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Analyzing State */}
        {step === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scan className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Analyse en cours...</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Nos algorithmes WOUAKA vérifient vos documents. Cette opération peut prendre quelques secondes.
            </p>
            <div className="max-w-xs mx-auto space-y-3">
              <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm">Documents téléchargés</span>
              </div>
              <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm">Vérification d'identité...</span>
              </div>
              <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Analyse anti-fraude</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Documents soumis avec succès !</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Vos documents ont été transmis pour vérification. 
              Vous serez contacté par votre institution financière une fois l'analyse terminée.
            </p>
            <Card className="max-w-sm mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-left">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Délai de traitement</p>
                    <p className="text-sm text-muted-foreground">24 à 48 heures ouvrées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Propulsé par Wouaka • Vérification d'identité sécurisée pour l'Afrique de l'Ouest</p>
        </div>
      </footer>
    </div>
  );
};

export default SubmitDocuments;
