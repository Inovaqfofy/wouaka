import { useState, useRef, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  ArrowRight,
  Smile,
  Eye
} from 'lucide-react';
import { useFaceVerification, LivenessChallenge, LivenessResult } from '@/hooks/useFaceVerification';

interface LivenessCheckProps {
  onComplete: (result: LivenessResult) => void;
  onSkip?: () => void;
}

const challengeIcons: Record<string, React.ReactNode> = {
  turn_left: <ArrowLeft className="h-8 w-8" />,
  turn_right: <ArrowRight className="h-8 w-8" />,
  smile: <Smile className="h-8 w-8" />,
  blink: <Eye className="h-8 w-8" />,
};

export function LivenessCheck({ onComplete, onSkip }: LivenessCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'checking' | 'complete'>('idle');
  const [currentChallenge, setCurrentChallenge] = useState<LivenessChallenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [result, setResult] = useState<LivenessResult | null>(null);
  
  const {
    modelsLoaded,
    loading,
    error,
    loadModels,
    startCamera,
    stopCamera,
    runLivenessCheck,
  } = useFaceVerification();

  // Initialize camera and models
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

  // Start liveness check
  const startCheck = useCallback(async () => {
    if (!videoRef.current) return;
    
    setStatus('checking');
    setChallengeIndex(0);
    setCurrentChallenge(null);
    
    const livenessResult = await runLivenessCheck(
      videoRef.current,
      (challenge, index) => {
        setCurrentChallenge(challenge);
        setChallengeIndex(index);
      }
    );
    
    setResult(livenessResult);
    setStatus('complete');
    stopCamera();
    onComplete(livenessResult);
  }, [runLivenessCheck, stopCamera, onComplete]);

  // Retry check
  const retry = useCallback(() => {
    setResult(null);
    setCurrentChallenge(null);
    setChallengeIndex(0);
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const progress = status === 'checking' 
    ? ((challengeIndex + (currentChallenge?.completed ? 1 : 0)) / 3) * 100 
    : status === 'complete' 
      ? 100 
      : 0;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Détection de vivacité
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Video container */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${status === 'complete' ? 'hidden' : ''}`}
          />
          
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">
                La caméra sera utilisée pour vérifier votre identité en temps réel
              </p>
              <Button onClick={initialize} disabled={loading}>
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
            </div>
          )}
          
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Initialisation...</p>
            </div>
          )}
          
          {status === 'complete' && result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              {result.passed ? (
                <>
                  <CheckCircle2 className="h-20 w-20 text-green-500" />
                  <p className="text-xl font-semibold text-green-700">
                    Vérification réussie !
                  </p>
                  <Badge variant="default" className="text-lg px-4 py-1">
                    Score: {result.score.toFixed(0)}%
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 text-destructive" />
                  <p className="text-xl font-semibold text-destructive">
                    Vérification échouée
                  </p>
                  <p className="text-muted-foreground text-center">
                    Certains défis n'ont pas été complétés
                  </p>
                  <Button onClick={retry} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réessayer
                  </Button>
                </>
              )}
            </div>
          )}
          
          {/* Challenge overlay */}
          {status === 'checking' && currentChallenge && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center justify-center gap-4 text-white">
                <div className={currentChallenge.completed ? 'text-green-400' : 'animate-pulse'}>
                  {challengeIcons[currentChallenge.type]}
                </div>
                <div>
                  <p className="font-semibold text-lg">{currentChallenge.label}</p>
                  <p className="text-sm text-white/80">{currentChallenge.instruction}</p>
                </div>
                {currentChallenge.completed && (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Progress */}
        {(status === 'checking' || status === 'complete') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {status === 'ready' && (
            <Button onClick={startCheck} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Démarrer la vérification
            </Button>
          )}
          
          {onSkip && status !== 'checking' && (
            <Button variant="ghost" onClick={onSkip}>
              Passer cette étape
            </Button>
          )}
        </div>
        
        {/* Instructions */}
        {status === 'ready' && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Assurez-vous d'être dans un endroit bien éclairé</li>
                <li>Positionnez votre visage au centre de l'écran</li>
                <li>Suivez les instructions qui s'afficheront</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
