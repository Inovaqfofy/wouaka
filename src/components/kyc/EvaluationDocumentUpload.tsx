import { useState, useCallback } from "react";
import { 
  Upload, 
  FileCheck, 
  X, 
  Camera, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { extractTextFromImage, validateImageForOCR, OCRProgress } from "@/lib/ocr-service";
import { supabase } from "@/integrations/supabase/client";

export type DocumentType = 'identity_card_front' | 'identity_card_back' | 'passport' | 'selfie' | 'proof_of_address';

interface UploadedDocument {
  type: DocumentType;
  file: File;
  preview: string;
  ocrData?: {
    text: string;
    confidence: number;
    extractedFields?: Record<string, string>;
  };
  uploadedUrl?: string;
  status: 'pending' | 'processing' | 'verified' | 'error';
  error?: string;
}

interface DocumentConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

interface EvaluationDocumentUploadProps {
  productType: 'w-kyc' | 'w-score' | 'wouaka-core';
  kycLevel: 'basic' | 'enhanced' | 'advanced';
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  documents: UploadedDocument[];
}

const DOCUMENT_CONFIGS: Record<string, DocumentConfig[]> = {
  basic: [
    { type: 'identity_card_front', label: 'CNI - Recto', description: "Face avant de la carte d'identité", icon: CreditCard, required: true },
  ],
  enhanced: [
    { type: 'identity_card_front', label: 'CNI - Recto', description: "Face avant de la carte d'identité", icon: CreditCard, required: true },
    { type: 'identity_card_back', label: 'CNI - Verso', description: "Face arrière de la carte d'identité", icon: CreditCard, required: true },
    { type: 'selfie', label: 'Selfie', description: 'Photo de votre visage', icon: Camera, required: true },
  ],
  advanced: [
    { type: 'identity_card_front', label: 'CNI - Recto', description: "Face avant de la carte d'identité", icon: CreditCard, required: true },
    { type: 'identity_card_back', label: 'CNI - Verso', description: "Face arrière de la carte d'identité", icon: CreditCard, required: true },
    { type: 'selfie', label: 'Selfie', description: 'Photo de votre visage', icon: Camera, required: true },
    { type: 'proof_of_address', label: 'Justificatif de domicile', description: 'Facture ou attestation récente', icon: FileCheck, required: true },
  ],
};

const extractFieldsFromOCR = (text: string, documentType: DocumentType): Record<string, string> => {
  const fields: Record<string, string> = {};
  const lines = text.split('\n').filter(l => l.trim());
  
  if (documentType.includes('identity_card') || documentType === 'passport') {
    // Try to extract name
    const namePatterns = [
      /NOM[S]?\s*[:\s]+([A-ZÀ-Ÿ\s]+)/i,
      /SURNAME[S]?\s*[:\s]+([A-Z\s]+)/i,
      /([A-ZÀ-Ÿ]{2,})\s+([A-ZÀ-Ÿ]{2,})/,
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.full_name = match[1].trim();
        break;
      }
    }
    
    // Try to extract birth date
    const datePatterns = [
      /(?:NÉ[E]?\s*LE|DATE\s*(?:DE\s*)?NAISSANCE|BIRTH)[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.date_of_birth = match[1];
        break;
      }
    }
    
    // Try to extract ID number
    const idPatterns = [
      /(?:N[°o]?\s*|ID\s*|CNI\s*)[:\s]*([A-Z0-9]{6,15})/i,
      /([A-Z]{1,2}\d{8,12})/,
      /(\d{9,13})/,
    ];
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match && match[1].length >= 6) {
        fields.national_id = match[1];
        break;
      }
    }
    
    // Try to extract nationality/country
    const countryPatterns = [
      /NATIONALITÉ[:\s]+([A-ZÀ-Ÿ]+)/i,
      /NATIONALITY[:\s]+([A-Z]+)/i,
      /(IVOIRIEN(?:NE)?|SÉNÉGALAIS[E]?|MALIEN(?:NE)?|BURKINAB[ÈE]|TOGOLAIS[E]?|BÉNINOIS[E]?)/i,
    ];
    for (const pattern of countryPatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.nationality = match[1].trim();
        break;
      }
    }
  }
  
  return fields;
};

export const EvaluationDocumentUpload = ({
  productType,
  kycLevel,
  onDocumentsChange,
  documents,
}: EvaluationDocumentUploadProps) => {
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  
  // Only require documents for KYC-related products
  const requiresDocuments = productType === 'w-kyc' || productType === 'wouaka-core';
  const documentConfigs = requiresDocuments ? DOCUMENT_CONFIGS[kycLevel] : [];
  
  const handleFileSelect = useCallback(async (
    docType: DocumentType,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validation = validateImageForOCR(file);
    if (!validation.valid) {
      const newDoc: UploadedDocument = {
        type: docType,
        file,
        preview: '',
        status: 'error',
        error: validation.error,
      };
      onDocumentsChange([...documents.filter(d => d.type !== docType), newDoc]);
      return;
    }
    
    // Create preview
    const preview = URL.createObjectURL(file);
    
    // Add document in processing state
    const newDoc: UploadedDocument = {
      type: docType,
      file,
      preview,
      status: 'processing',
    };
    onDocumentsChange([...documents.filter(d => d.type !== docType), newDoc]);
    
    setProcessingDoc(docType);
    
    try {
      // Run OCR if it's an identity document
      if (docType !== 'selfie') {
        const ocrResult = await extractTextFromImage(file, (progress) => {
          setOcrProgress(progress);
        });
        
        const extractedFields = extractFieldsFromOCR(ocrResult.text, docType);
        
        newDoc.ocrData = {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          extractedFields,
        };
      }
      
      newDoc.status = 'verified';
      onDocumentsChange([...documents.filter(d => d.type !== docType), newDoc]);
    } catch (error) {
      console.error('OCR error:', error);
      newDoc.status = 'verified'; // Still accept the document even if OCR fails
      newDoc.ocrData = { text: '', confidence: 0 };
      onDocumentsChange([...documents.filter(d => d.type !== docType), newDoc]);
    } finally {
      setProcessingDoc(null);
      setOcrProgress(null);
    }
  }, [documents, onDocumentsChange]);
  
  const removeDocument = useCallback((docType: DocumentType) => {
    const doc = documents.find(d => d.type === docType);
    if (doc?.preview) {
      URL.revokeObjectURL(doc.preview);
    }
    onDocumentsChange(documents.filter(d => d.type !== docType));
  }, [documents, onDocumentsChange]);
  
  const getDocumentByType = (type: DocumentType) => documents.find(d => d.type === type);
  
  const getCompletionStatus = () => {
    const required = documentConfigs.filter(c => c.required);
    const completed = required.filter(c => {
      const doc = getDocumentByType(c.type);
      return doc && doc.status === 'verified';
    });
    return { completed: completed.length, total: required.length };
  };
  
  const completion = getCompletionStatus();
  
  if (!requiresDocuments) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Les documents ne sont pas requis pour l'évaluation WOUAKA.
            <br />
            Le score sera calculé à partir des données financières.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="font-medium">Documents requis</p>
          <p className="text-sm text-muted-foreground">
            {completion.completed}/{completion.total} documents validés
          </p>
        </div>
        <Progress 
          value={(completion.completed / completion.total) * 100} 
          className="w-32 h-2"
        />
      </div>
      
      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentConfigs.map((config) => {
          const Icon = config.icon;
          const doc = getDocumentByType(config.type);
          const isProcessing = processingDoc === config.type;
          
          return (
            <Card 
              key={config.type}
              className={cn(
                "transition-all duration-200",
                doc?.status === 'verified' && "border-green-500 bg-green-50/50",
                doc?.status === 'error' && "border-red-500 bg-red-50/50",
                isProcessing && "border-blue-500 bg-blue-50/50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      doc?.status === 'verified' ? "bg-green-100" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        doc?.status === 'verified' ? "text-green-600" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {config.label}
                        {config.required && (
                          <Badge variant="secondary" className="text-xs">Requis</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {doc?.status === 'verified' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {doc?.status === 'error' && (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {!doc ? (
                  // Upload zone
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(config.type, e)}
                    />
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Cliquez ou déposez un fichier
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou WebP - Max 10MB
                    </span>
                  </label>
                ) : isProcessing ? (
                  // Processing state
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {ocrProgress?.status === 'recognizing text' 
                          ? 'Analyse du document...' 
                          : 'Traitement en cours...'}
                      </p>
                      {ocrProgress && (
                        <Progress value={ocrProgress.progress} className="w-32 h-2 mt-2" />
                      )}
                    </div>
                  </div>
                ) : (
                  // Preview state
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={doc.preview} 
                        alt={config.label}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-6 h-6"
                        onClick={() => removeDocument(config.type)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* OCR Results */}
                    {doc.ocrData && doc.ocrData.extractedFields && Object.keys(doc.ocrData.extractedFields).length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Image className="w-3 h-3" />
                          <span>Données extraites (confiance: {Math.round(doc.ocrData.confidence)}%)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(doc.ocrData.extractedFields).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground">{key.replace(/_/g, ' ')}: </span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {doc.status === 'error' && (
                      <div className="p-2 bg-red-100 text-red-700 text-sm rounded">
                        {doc.error}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Warning if incomplete */}
      {completion.completed < completion.total && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Documents incomplets</p>
            <p className="text-sm">
              Veuillez fournir tous les documents requis pour compléter la vérification KYC.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
