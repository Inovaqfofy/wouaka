import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Check, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Sparkles,
  FileText,
  User,
  Calendar,
  Hash,
  ShieldCheck,
  Globe,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOCR } from '@/hooks/useOCR';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { smartPreprocess, isOpenCVLoaded } from '@/lib/document-preprocessor';

interface ExtractedData {
  full_name?: string;
  date_of_birth?: string;
  document_number?: string;
  expiry_date?: string;
  nationality?: string;
  gender?: string;
  place_of_birth?: string;
}

interface DocumentOCRPreviewProps {
  file: File;
  documentType: string;
  onDataExtracted: (data: ExtractedData, confidence: number) => void;
  onCancel: () => void;
}

export function DocumentOCRPreview({ 
  file, 
  documentType, 
  onDataExtracted, 
  onCancel 
}: DocumentOCRPreviewProps) {
  const { processImage, isProcessing, progress, result, error } = useOCR();
  const { toast } = useToast();
  
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string>('');
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [mrzValidated, setMrzValidated] = useState(false);
  const [isUEMOA, setIsUEMOA] = useState(false);
  const [isCEDEAO, setIsCEDEAO] = useState(false);

  // Generate preview URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Start OCR automatically with timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        // OCR taking too long, show manual fallback
        toast({
          title: 'Analyse lente',
          description: 'L\'OCR prend du temps. Vous pouvez saisir manuellement.',
          variant: 'default',
        });
      }
    }, 30000); // 30 second timeout warning
    
    startOCR();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const startOCR = async () => {
    // Step 1: Preprocess image with OpenCV.js
    setIsPreprocessing(true);
    let fileToProcess = file;
    
    try {
      const preprocessResult = await smartPreprocess(file);
      if (preprocessResult.success && preprocessResult.processedImageUrl) {
        setProcessedPreviewUrl(preprocessResult.processedImageUrl);
        // Convert processed image to File for OCR
        const response = await fetch(preprocessResult.processedImageUrl);
        const blob = await response.blob();
        fileToProcess = new File([blob], file.name, { type: 'image/jpeg' });
        console.log('[OCR] Image preprocessed:', preprocessResult.steps.filter(s => s.applied).map(s => s.name).join(', '));
      }
    } catch (err) {
      console.warn('[OCR] Preprocessing failed, using original image:', err);
    } finally {
      setIsPreprocessing(false);
    }

    // Step 2: Run OCR
    const ocrResult = await processImage(fileToProcess);
    
    if (ocrResult && ocrResult.text) {
      setOverallConfidence(ocrResult.confidence);
      await analyzeDocument(ocrResult.text);
    }
  };
  
  const analyzeDocument = async (ocrText: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('document-analyze', {
        body: { 
          ocr_text: ocrText,
          document_type: documentType,
          ocr_confidence: overallConfidence
        }
      });

      if (error) throw error;

      // Handle MRZ validation badges
      if (data.mrz_validated) {
        setMrzValidated(true);
        toast({
          title: "✅ MRZ Vérifié",
          description: "Document authentifié par validation cryptographique ICAO 9303",
          variant: "default"
        });
      }

      // Check for UEMOA/CEDEAO badges
      if (data.raw_fields?.is_uemoa || data.is_uemoa) {
        setIsUEMOA(true);
      }
      if (data.raw_fields?.is_cedeao || data.is_cedeao) {
        setIsCEDEAO(true);
      }

      if (data) {
        setExtractedData({
          full_name: data.full_name || data.raw_fields?.full_name,
          date_of_birth: data.birth_date || data.raw_fields?.birth_date,
          document_number: data.document_number || data.raw_fields?.document_number,
          expiry_date: data.expiry_date || data.raw_fields?.expiry_date,
          nationality: data.nationality || data.raw_fields?.nationality,
          gender: data.gender || data.raw_fields?.gender,
        });
        setOverallConfidence(data.extraction_confidence || data.overall_confidence || overallConfidence);
      }
    } catch (err) {
      console.error('Document analysis failed, using regex fallback:', err);
      const fallbackData = extractWithRegex(ocrText);
      setExtractedData(fallbackData);
      toast({
        title: "Analyse simplifiée",
        description: "Extraction basique effectuée. Veuillez vérifier les informations.",
        variant: "default"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWithDeepSeek = async (ocrText: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('document-analyze', {
        body: { 
          ocr_text: ocrText,
          document_type: documentType
        }
      });

      if (error) throw error;

      if (data.extracted_data) {
        setExtractedData(data.extracted_data);
        setOverallConfidence(data.confidence || overallConfidence);
      }
    } catch (err) {
      console.error('DeepSeek analysis failed, using regex fallback:', err);
      // Fallback: extract with regex patterns
      const fallbackData = extractWithRegex(ocrText);
      setExtractedData(fallbackData);
      toast({
        title: "Analyse simplifiée",
        description: "Extraction basique effectuée. Veuillez vérifier les informations.",
        variant: "default"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractWithRegex = (text: string): ExtractedData => {
    const data: ExtractedData = {};
    
    // Date patterns (DD/MM/YYYY or DD-MM-YYYY)
    const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g;
    const dates = text.match(datePattern) || [];
    
    if (dates.length > 0) {
      data.date_of_birth = dates[0];
      if (dates.length > 1) {
        data.expiry_date = dates[dates.length - 1];
      }
    }

    // Document number patterns
    const idPatterns = [
      /[A-Z]{2}\d{7}/g, // CI format
      /\d{9}/g, // 9 digits
      /[A-Z]\d{8}/g, // Letter + 8 digits
    ];
    
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.document_number = match[0];
        break;
      }
    }

    // Name extraction (lines with only letters and spaces, likely names)
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const cleanLine = line.trim();
      if (/^[A-ZÀ-Ü\s]{5,}$/i.test(cleanLine) && cleanLine.split(' ').length >= 2) {
        data.full_name = cleanLine;
        break;
      }
    }

    return data;
  };

  const handleFieldChange = (field: keyof ExtractedData, value: string) => {
    setExtractedData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    onDataExtracted(extractedData, overallConfidence);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const isLoading = isProcessing || isAnalyzing || isPreprocessing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Image Preview */}
      <div className="relative rounded-lg overflow-hidden border bg-muted/30">
        <img 
          src={processedPreviewUrl || previewUrl} 
          alt="Document preview" 
          className="w-full h-48 object-contain"
        />
        
        {/* MRZ/UEMOA/CEDEAO Badges */}
        {!isLoading && (mrzValidated || isUEMOA || isCEDEAO) && (
          <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
            {mrzValidated && (
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                MRZ Vérifié
              </Badge>
            )}
            {isUEMOA && (
              <Badge className="bg-blue-600 text-white flex items-center gap-1">
                <Globe className="h-3 w-3" />
                UEMOA
              </Badge>
            )}
            {isCEDEAO && !isUEMOA && (
              <Badge className="bg-amber-600 text-white flex items-center gap-1">
                <Globe className="h-3 w-3" />
                CEDEAO
              </Badge>
            )}
          </div>
        )}
        
        {/* OCR Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <div className="text-center space-y-3">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  {isPreprocessing ? (
                    <ScanLine className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {isPreprocessing ? 'Prétraitement de l\'image...' : 
                     isProcessing ? 'Lecture OCR du document...' : 
                     'Analyse et validation MRZ...'}
                  </p>
                  {progress && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.status} ({progress.progress}%)
                    </p>
                  )}
                </div>
                {progress && (
                  <Progress value={progress.progress} className="w-48 mx-auto" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Erreur de lecture</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={startOCR}>
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Extracted Data */}
      {!isLoading && !error && Object.keys(extractedData).length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Données extraites</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getConfidenceColor(overallConfidence)}>
                  Confiance: {Math.round(overallConfidence)}%
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Eye className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {/* Full Name */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEditing ? (
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nom complet</Label>
                    <Input
                      value={extractedData.full_name || ''}
                      onChange={(e) => handleFieldChange('full_name', e.target.value)}
                      placeholder="Nom complet"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{extractedData.full_name || '—'}</p>
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEditing ? (
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Date de naissance</Label>
                    <Input
                      value={extractedData.date_of_birth || ''}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      placeholder="JJ/MM/AAAA"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{extractedData.date_of_birth || '—'}</p>
                  </div>
                )}
              </div>

              {/* Document Number */}
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEditing ? (
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">N° Document</Label>
                    <Input
                      value={extractedData.document_number || ''}
                      onChange={(e) => handleFieldChange('document_number', e.target.value)}
                      placeholder="Numéro du document"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">N° Document</p>
                    <p className="font-medium font-mono">{extractedData.document_number || '—'}</p>
                  </div>
                )}
              </div>

              {/* Expiry Date */}
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEditing ? (
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Date d'expiration</Label>
                    <Input
                      value={extractedData.expiry_date || ''}
                      onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                      placeholder="JJ/MM/AAAA"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">Date d'expiration</p>
                    <p className="font-medium">{extractedData.expiry_date || '—'}</p>
                  </div>
                )}
              </div>
            </div>

            {overallConfidence < 70 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Confiance faible. Veuillez vérifier et corriger les informations si nécessaire.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {!isLoading && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 bg-primary"
            disabled={Object.keys(extractedData).length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmer et continuer
          </Button>
        </div>
      )}
    </motion.div>
  );
}
