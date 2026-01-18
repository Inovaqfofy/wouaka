/**
 * WOUAKA USSD Screenshot Upload
 * Component for uploading Mobile Money profile screenshots
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Shield,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UssdScreenshotResult } from '@/lib/trust-graph/ussd-screenshot-analyzer';

interface UssdScreenshotUploadProps {
  onAnalysisComplete: (result: UssdScreenshotResult, canCertify: boolean) => void;
  cniName?: string;
  className?: string;
}

export const UssdScreenshotUpload: React.FC<UssdScreenshotUploadProps> = ({
  onAnalysisComplete,
  cniName,
  className,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<UssdScreenshotResult | null>(null);
  const [validationResult, setValidationResult] = useState<{
    canCertify: boolean;
    reasons: string[];
    score: number;
  } | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10 Mo');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setValidationResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress (OCR is async but doesn't report progress)
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Dynamic import to avoid loading Tesseract on page load
      const { analyzeUssdScreenshot, validateForCertification } = await import(
        '@/lib/trust-graph/ussd-screenshot-analyzer'
      );

      const analysisResult = await analyzeUssdScreenshot(file, cniName);
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      const validation = validateForCertification(analysisResult);

      setResult(analysisResult);
      setValidationResult(validation);
      onAnalysisComplete(analysisResult, validation.canCertify);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Erreur lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setValidationResult(null);
    setAnalysisProgress(0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Capture profil Mobile Money
        </CardTitle>
        <CardDescription>
          Capturez l'écran de votre profil MoMo (via *122#, *144# ou l'application)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert className="bg-muted/50">
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Instructions :</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Ouvrez votre application Mobile Money</li>
              <li>Allez dans "Mon compte" ou "Profil"</li>
              <li>Faites une capture d'écran montrant votre nom</li>
              <li>Uploadez la capture ici</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Upload area */}
        {!preview && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="ussd-upload"
            />
            <label
              htmlFor="ussd-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Cliquez pour uploader</p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG jusqu'à 10 Mo
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Preview */}
        {preview && !result && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={preview}
                alt="Aperçu"
                className="w-full max-h-64 object-contain bg-muted"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            {isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyse OCR en cours...</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            ) : (
              <Button onClick={handleAnalyze} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Analyser la capture
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        {result && validationResult && (
          <div className="space-y-4">
            {/* Validation status */}
            <div
              className={cn(
                'p-4 rounded-lg border',
                validationResult.canCertify
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                  : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
              )}
            >
              <div className="flex items-start gap-3">
                {validationResult.canCertify ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium">
                    {validationResult.canCertify
                      ? 'Capture validée !'
                      : 'Validation partielle'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Score de validation : {validationResult.score}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted data */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Données extraites</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Provider</span>
                  <p className="font-medium capitalize">
                    {result.provider.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Confiance OCR</span>
                  <p className="font-medium">{Math.round(result.ocrConfidence)}%</p>
                </div>
                {result.extractedName && (
                  <div className="col-span-2 p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Nom extrait</span>
                    <p className="font-medium">{result.extractedName}</p>
                  </div>
                )}
                {result.extractedBalance && (
                  <div className="p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Solde</span>
                    <p className="font-medium">
                      {result.extractedBalance.toLocaleString()} FCFA
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Name match result */}
            {result.nameMatchResult && (
              <div
                className={cn(
                  'p-3 rounded-lg border',
                  result.nameMatchResult.isMatch
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Correspondance CNI : {result.nameMatchResult.matchScore}%
                  </span>
                  <Badge
                    variant={result.nameMatchResult.isMatch ? 'default' : 'destructive'}
                  >
                    {result.nameMatchResult.isMatch ? 'Validé' : 'Non correspondant'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Issues */}
            {validationResult.reasons.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-yellow-700">Points à améliorer</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {validationResult.reasons.map((reason, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="outline" onClick={handleReset} className="w-full">
              Uploader une autre capture
            </Button>
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 L'image est analysée localement et n'est jamais stockée sur nos serveurs.
        </p>
      </CardContent>
    </Card>
  );
};

export default UssdScreenshotUpload;
