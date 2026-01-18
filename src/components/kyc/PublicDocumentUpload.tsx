import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, X, FileText, AlertTriangle, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractTextFromImage, validateImageForOCR, type OCRProgress } from "@/lib/ocr-service";
import type { LucideIcon } from "lucide-react";

// Formats acceptés
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_PDF_TYPE = 'application/pdf';
const ALL_ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPE];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface PublicDocumentUploadProps {
  documentId: string;
  label: string;
  description: string;
  icon: LucideIcon;
  optional?: boolean;
  isUploaded: boolean;
  onUpload: (url: string, ocrData?: { text: string; confidence: number }) => void;
  partnerId: string;
  clientName: string;
}

export const PublicDocumentUpload = ({
  documentId,
  label,
  description,
  icon: Icon,
  optional,
  isUploaded,
  onUpload,
  partnerId,
  clientName,
}: PublicDocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploadError(null);
    
    // Validate file type
    if (!ALL_ACCEPTED_TYPES.includes(file.type)) {
      const errorMsg = `Format non supporté "${file.type.split('/')[1] || 'inconnu'}". Formats acceptés: JPG, PNG, WebP ou PDF.`;
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const errorMsg = `Fichier trop volumineux (${sizeMB} MB). Maximum ${MAX_FILE_SIZE_MB} MB.`;
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Show preview for images
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      // PDF icon preview
      setPreview('pdf');
    }

    setIsUploading(true);
    let uploadedUrl: string | null = null;
    let ocrData: { text: string; confidence: number } | undefined;

    try {
      // 1. Upload file to Supabase Storage
      const timestamp = Date.now();
      const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const extension = file.name.split('.').pop();
      const fileName = `${partnerId}/${sanitizedClientName}/${documentId}_${timestamp}.${extension}`;

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      uploadedUrl = publicUrl;
      setIsUploading(false);

      // 2. Perform OCR analysis for images
      if (isImage) {
        setIsAnalyzing(true);
        setOcrProgress({ status: 'Initialisation OCR...', progress: 0 });

        try {
          // Validate image for OCR
          const validation = validateImageForOCR(file);
          if (!validation.valid) {
            console.warn('OCR validation warning:', validation.error);
          }

          // Run OCR with progress tracking
          const ocrResult = await extractTextFromImage(file, (progress) => {
            setOcrProgress(progress);
          });

          ocrData = {
            text: ocrResult.text,
            confidence: ocrResult.confidence
          };

          console.log('OCR completed:', {
            documentId,
            textLength: ocrResult.text.length,
            confidence: ocrResult.confidence,
            wordsFound: ocrResult.words.length
          });

          // 3. Send to document-analyze edge function for AI extraction
          if (ocrResult.text.length > 10) {
            setOcrProgress({ status: 'Analyse du document...', progress: 95 });
            
            try {
              const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('document-analyze', {
                body: {
                  ocr_text: ocrResult.text,
                  document_type: mapDocumentType(documentId),
                  ocr_confidence: ocrResult.confidence
                }
              });

              if (analysisError) {
                console.error('Document analysis error:', analysisError);
              } else {
                console.log('Document analysis result:', analysisResult);
              }
            } catch (analysisErr) {
              console.error('Failed to call document-analyze:', analysisErr);
            }
          }

          toast.success(`${label} analysé avec succès (confiance: ${Math.round(ocrResult.confidence)}%)`);
        } catch (ocrError) {
          console.error('OCR error:', ocrError);
          toast.warning(`Document téléchargé mais l'analyse OCR a échoué. Une vérification manuelle sera effectuée.`);
        } finally {
          setIsAnalyzing(false);
          setOcrProgress(null);
        }
      } else {
        // PDF - just notify success
        toast.success(`${label} téléchargé avec succès`);
      }

      onUpload(uploadedUrl, ocrData);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = "Erreur lors du téléchargement. Veuillez réessayer.";
      setUploadError(errorMsg);
      toast.error(errorMsg);
      setPreview(null);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setOcrProgress(null);
    }
  };

  const mapDocumentType = (docId: string): string => {
    const mapping: Record<string, string> = {
      'national_id': 'cni',
      'selfie': 'selfie',
      'proof_of_address': 'justificatif_domicile',
      'passport': 'passport',
      'bank_statement': 'releve_bancaire'
    };
    return mapping[docId] || 'unknown';
  };

  const clearUpload = () => {
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessing = isUploading || isAnalyzing;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all",
        isDragging && "ring-2 ring-primary ring-offset-2",
        isUploaded && "border-success/50 bg-success/5",
        uploadError && "border-destructive/50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon or Preview */}
          <div className="relative flex-shrink-0">
            {preview ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                {preview === 'pdf' ? (
                  <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                    <FileText className="w-8 h-8 text-destructive" />
                  </div>
                ) : (
                  <img 
                    src={preview} 
                    alt="Aperçu" 
                    className="w-full h-full object-cover"
                  />
                )}
                {!isUploaded && !isProcessing && (
                  <button
                    onClick={clearUpload}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center",
                isUploaded ? "bg-success/10" : "bg-muted"
              )}>
                {isUploaded ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Icon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{label}</p>
              {optional && (
                <Badge variant="outline" className="text-xs flex-shrink-0">Optionnel</Badge>
              )}
              {isUploaded && (
                <Badge variant="success" className="text-xs flex-shrink-0">Vérifié</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            
            {/* Formats acceptés */}
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span className="font-medium">Formats:</span>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">JPG</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">PNG</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">WebP</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">PDF</Badge>
              </div>
              <span className="text-muted-foreground/60">• Max {MAX_FILE_SIZE_MB}MB</span>
            </div>

            {/* Error display */}
            {uploadError && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-destructive/10 rounded-md text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload progress */}
            {isProcessing && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-primary">
                  {isAnalyzing ? (
                    <Scan className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>
                    {ocrProgress?.status || (isUploading ? 'Téléchargement...' : 'Analyse...')}
                  </span>
                </div>
                {ocrProgress && (
                  <Progress value={ocrProgress.progress} className="h-1.5" />
                )}
              </div>
            )}

            {!isUploaded && !isProcessing && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALL_ACCEPTED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    <span>Glissez un fichier ou </span>
                    <span className="text-primary underline font-medium">parcourir</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
