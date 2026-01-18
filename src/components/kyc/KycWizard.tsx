import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Home,
  Wallet,
  Sparkles,
  Eye,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wizard, WizardContent, WizardFooter } from '@/components/ui/wizard';
import { useKyc } from '@/hooks/useKyc';
import { DocumentOCRPreview } from './DocumentOCRPreview';
import { PhoneCertificationStep } from './PhoneCertificationStep';
import { validateImageForOCR } from '@/lib/ocr-service';
import type { KycDocument } from '@/stores/useKycStore';

// Document types that support OCR
const OCR_SUPPORTED_TYPES = ['national_id', 'passport'];

const stepIcons: Record<string, React.ReactNode> = {
  national_id: <Shield className="h-5 w-5" />,
  passport: <Shield className="h-5 w-5" />,
  proof_of_address: <Home className="h-5 w-5" />,
  income_proof: <Wallet className="h-5 w-5" />,
  rccm: <FileText className="h-5 w-5" />,
  bank_statement: <FileText className="h-5 w-5" />,
  phone_certification: <Phone className="h-5 w-5" />,
};

export function KycWizard() {
  const {
    documents,
    validation,
    currentStep,
    isUploading,
    uploadProgress,
    documentTypes,
    fetchKycData,
    uploadDocument,
    deleteDocument,
    startValidation,
    getKycStatus,
    setCurrentStep,
  } = useKyc();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOCRPreview, setShowOCRPreview] = useState(false);
  const [extractedOCRData, setExtractedOCRData] = useState<Record<string, any> | null>(null);
  const [showPhoneCertification, setShowPhoneCertification] = useState(false);
  const [phoneCertified, setPhoneCertified] = useState(false);
  const [certificationResult, setCertificationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKycData();
  }, [fetchKycData]);

  const kycStatus = getKycStatus();

  const wizardSteps = documentTypes.map((docType) => ({
    id: docType.id,
    title: docType.label,
    description: docType.required ? 'Requis' : 'Optionnel',
  }));

  // Add final review step
  wizardSteps.push({
    id: 'review',
    title: 'Validation',
    description: 'Soumettre pour vérification',
  });

  const currentDocType = documentTypes[currentStep];
  const currentDocument = documents.find(d => d.document_type === currentDocType?.id);
  const isReviewStep = currentStep === documentTypes.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Check if this document type supports OCR and is an image
      if (currentDocType && OCR_SUPPORTED_TYPES.includes(currentDocType.id)) {
        const validation = validateImageForOCR(file);
        if (validation.valid) {
          setShowOCRPreview(true);
        }
      }
    }
  };

  const handleOCRDataExtracted = (data: Record<string, any>, confidence: number) => {
    setExtractedOCRData({ ...data, ocr_confidence: confidence });
    setShowOCRPreview(false);
    // Auto-upload after OCR confirmation
    handleUploadWithOCR(data, confidence);
  };

  const handleUploadWithOCR = async (ocrData: Record<string, any>, confidence: number) => {
    if (!selectedFile || !currentDocType) return;
    
    await uploadDocument(selectedFile, currentDocType.id, {
      ocr_data: ocrData,
      ocr_confidence: confidence
    });
    
    setSelectedFile(null);
    setExtractedOCRData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelOCR = () => {
    setShowOCRPreview(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentDocType) return;
    
    await uploadDocument(selectedFile, currentDocType.id);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedFile(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedFile(null);
    }
  };

  const handleSubmit = async () => {
    await startValidation();
  };

  const getDocumentStatusBadge = (doc?: KycDocument) => {
    if (!doc) return <Badge variant="outline">Non téléchargé</Badge>;
    
    switch (doc.status) {
      case 'pending':
        return <Badge variant="secondary">En attente de vérification</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">En cours de traitement</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Vérifié</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{doc.status}</Badge>;
    }
  };

  // If validation is complete or in progress, show status
  if (validation && ['approved', 'in_progress', 'pending'].includes(validation.status)) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {validation.status === 'approved' ? (
              <Check className="h-16 w-16 text-green-500" />
            ) : (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
          </div>
          <CardTitle>
            {validation.status === 'approved' 
              ? 'KYC Approuvé' 
              : 'Vérification en cours'}
          </CardTitle>
          <CardDescription>
            {validation.status === 'approved'
              ? 'Votre identité a été vérifiée avec succès'
              : 'Votre dossier est en cours d\'examen par notre équipe'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {validation.identity_verified ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                <span>Identité</span>
              </div>
              <div className="flex items-center gap-2">
                {validation.address_verified ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                <span>Adresse</span>
              </div>
              <div className="flex items-center gap-2">
                {validation.income_verified ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                <span>Revenus</span>
              </div>
              <div className="flex items-center gap-2">
                {validation.documents_complete ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>Documents complets</span>
              </div>
            </div>

            {validation.risk_flags && validation.risk_flags.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Points d'attention:</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  {validation.risk_flags.map((flag, i) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Wizard
        steps={wizardSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        <WizardContent>
          {isReviewStep ? (
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
                <CardDescription>
                  Vérifiez vos documents avant de soumettre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {documentTypes.map((docType) => {
                  const doc = documents.find(d => d.document_type === docType.id);
                  return (
                    <div 
                      key={docType.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {stepIcons[docType.id]}
                        <div>
                          <p className="font-medium">{docType.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {docType.required ? 'Requis' : 'Optionnel'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusBadge(doc)}
                        {doc ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : docType.required ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      Progression: {kycStatus.documentsUploaded}/{kycStatus.documentsRequired} documents requis
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round((kycStatus.documentsUploaded / kycStatus.documentsRequired) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(kycStatus.documentsUploaded / kycStatus.documentsRequired) * 100} 
                  />
                </div>
              </CardContent>
            </Card>
          ) : currentDocType ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {stepIcons[currentDocType.id]}
                    <div>
                      <CardTitle>{currentDocType.label}</CardTitle>
                      <CardDescription>
                        {currentDocType.required 
                          ? 'Ce document est requis pour continuer'
                          : 'Ce document est optionnel'}
                      </CardDescription>
                    </div>
                  </div>
                  {OCR_SUPPORTED_TYPES.includes(currentDocType.id) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      OCR activé
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OCR Preview Mode */}
                {showOCRPreview && selectedFile && currentDocType ? (
                  <DocumentOCRPreview
                    file={selectedFile}
                    documentType={currentDocType.id}
                    onDataExtracted={handleOCRDataExtracted}
                    onCancel={handleCancelOCR}
                  />
                ) : currentDocument ? (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{currentDocument.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {currentDocument.file_size 
                              ? `${(currentDocument.file_size / 1024).toFixed(1)} KB` 
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusBadge(currentDocument)}
                        {currentDocument.ocr_confidence && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            OCR {Math.round(currentDocument.ocr_confidence)}%
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(currentDocument.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* OCR hint for supported documents */}
                    {OCR_SUPPORTED_TYPES.includes(currentDocType.id) && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Extraction automatique :</span>{' '}
                          Téléchargez une image et les informations seront extraites automatiquement par OCR.
                        </p>
                      </div>
                    )}

                    <div
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors hover:border-primary
                        ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-muted'}
                      `}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      {selectedFile && !showOCRPreview ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="h-8 w-8 text-green-600" />
                          <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, WebP ou PDF (max 10MB)
                          </p>
                        </>
                      )}
                    </div>

                    {selectedFile && !showOCRPreview && !OCR_SUPPORTED_TYPES.includes(currentDocType.id) && (
                      <Button 
                        onClick={handleUpload} 
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Téléchargement... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    )}

                    {isUploading && (
                      <Progress value={uploadProgress} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </WizardContent>

        <WizardFooter
          currentStep={currentStep}
          totalSteps={wizardSteps.length}
          onPrevious={handlePrevious}
          onNext={isReviewStep ? handleSubmit : handleNext}
          nextLabel={isReviewStep ? 'Soumettre pour validation' : 'Suivant'}
          completeLabel="Soumettre pour validation"
          canProgress={
            isReviewStep 
              ? kycStatus.isComplete 
              : (!!currentDocument || !currentDocType?.required)
          }
        />
      </Wizard>
    </div>
  );
}
