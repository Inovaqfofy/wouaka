import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Users,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useFaceVerification, FaceComparisonResult } from '@/hooks/useFaceVerification';

interface FaceComparisonProps {
  documentImageUrl: string;
  onComplete: (result: FaceComparisonResult) => void;
  onSkip?: () => void;
}

export function FaceComparison({ documentImageUrl, onComplete, onSkip }: FaceComparisonProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const documentImageRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'comparing' | 'complete'>('idle');
  const [result, setResult] = useState<FaceComparisonResult | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  
  const {
    loading,
    error,
    loadModels,
    startCamera,
    stopCamera,
    compareFaces,
    captureFrame,
  } = useFaceVerification();

  // Initialize
  const initialize = useCallback(async () => {
    setStatus('loading');
    
    try {
      await loadModels();
      
      if (videoRef.current) {
        await startCamera(videoRef.current);
      }
      
      setStatus('ready');
    } catch (err) {
      console.error('Initialization error:', err);
      setStatus('idle');
    }
  }, [loadModels, startCamera]);

  // Capture selfie and compare
  const captureAndCompare = useCallback(async () => {
    if (!videoRef.current || !documentImageRef.current) return;
    
    setStatus('comparing');
    
    try {
      // Capture selfie
      const selfieCanvas = captureFrame(videoRef.current);
      setSelfieDataUrl(selfieCanvas.toDataURL('image/jpeg'));
      
      // Compare faces
      const comparisonResult = await compareFaces(selfieCanvas, documentImageRef.current);
      
      setResult(comparisonResult);
      setStatus('complete');
      stopCamera();
      onComplete(comparisonResult);
    } catch (err) {
      console.error('Comparison error:', err);
      setStatus('ready');
    }
  }, [captureFrame, compareFaces, stopCamera, onComplete]);

  // Retry
  const retry = useCallback(() => {
    setResult(null);
    setSelfieDataUrl(null);
    initialize();
  }, [initialize]);

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500">Confiance élevée</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Confiance moyenne</Badge>;
      case 'low':
        return <Badge variant="destructive">Confiance faible</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comparaison faciale
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Images comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Document photo */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-center">Photo du document</p>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              <img
                ref={documentImageRef}
                src={documentImageUrl}
                alt="Photo du document"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  CNI
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Selfie */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-center">Votre selfie</p>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              {status === 'complete' && selfieDataUrl ? (
                <img
                  src={selfieDataUrl}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              
              {status === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Caméra inactive</p>
                </div>
              )}
              
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              {status === 'comparing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto mb-2" />
                    <p className="text-sm">Analyse en cours...</p>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">
                  <Camera className="h-3 w-3 mr-1" />
                  Selfie
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Result */}
        {status === 'complete' && result && (
          <div className={`p-4 rounded-lg ${result.matched ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.matched ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-destructive" />
                )}
                <div>
                  <p className="font-semibold">
                    {result.matched ? 'Visages correspondants' : 'Visages non correspondants'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Similarité: {result.similarity.toFixed(1)}%
                  </p>
                </div>
              </div>
              {getConfidenceBadge(result.confidence)}
            </div>
            
            <Progress 
              value={result.similarity} 
              className={`mt-3 h-2 ${result.matched ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
            />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {status === 'idle' && (
            <Button onClick={initialize} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Activer la caméra
                </>
              )}
            </Button>
          )}
          
          {status === 'ready' && (
            <Button onClick={captureAndCompare} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Prendre le selfie
            </Button>
          )}
          
          {status === 'complete' && !result?.matched && (
            <Button onClick={retry} variant="outline" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          )}
          
          {onSkip && status !== 'comparing' && (
            <Button variant="ghost" onClick={onSkip}>
              Passer
            </Button>
          )}
        </div>
        
        {/* Instructions */}
        {(status === 'idle' || status === 'ready') && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Placez votre visage bien en face de la caméra</li>
                <li>Assurez-vous que votre visage est bien éclairé</li>
                <li>Retirez lunettes, chapeau ou tout accessoire couvrant le visage</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
