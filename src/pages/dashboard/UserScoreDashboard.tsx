/**
 * UserScoreDashboard - Dashboard utilisateur WOUAKA
 * Affiche le score de crédit avec jauge radiale et statut KYC
 * * Échelle des scores : 0 à 100
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  TrendingUp,
  User,
  Clock
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScoreSkeletonCard, StatsSkeletonCard } from '@/components/ui/skeleton-card';
import { useWouakaScore } from '@/hooks/useWouakaScore';
import { parseWouakaSdkError, type WouakaSdkError } from '@/lib/wouaka-sdk-client';

// ============================================
// Types
// ============================================

interface UserInfo {
  name: string;
  email?: string;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  kycLevel?: string;
}

interface ScoreData {
  score: number;
  grade: string;
  risk_category: string;
  confidence: number;
  calculated_at: string;
}

// ============================================
// Helpers
// ============================================

/**
 * Retourne la couleur selon le score (0-100)
 */
function getScoreColor(score: number): string {
  if (score < 30) return '#ef4444'; // Rouge : Risque Élevé
  if (score < 60) return '#f97316'; // Orange : Risque Modéré
  return '#22c55e'; // Vert : Risque Faible
}

/**
 * Retourne le label du niveau de risque
 */
function getRiskLabel(score: number): string {
  if (score < 30) return 'Risque élevé';
  if (score < 60) return 'Risque modéré';
  return 'Risque faible';
}

/**
 * Retourne le badge KYC approprié
 */
function KycStatusBadge({ status }: { status: UserInfo['kycStatus'] }) {
  const config = {
    pending: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
    verified: { label: 'Vérifié', variant: 'default' as const, icon: CheckCircle2 },
    rejected: { label: 'Rejeté', variant: 'destructive' as const, icon: XCircle },
    expired: { label: 'Expiré', variant: 'outline' as const, icon: AlertCircle },
  };
  
  const { label, variant, icon: Icon } = config[status];
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================
// Score Gauge Component (Radial Chart)
// ============================================

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

function ScoreGauge({ score, maxScore = 100 }: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score);
  
  const data = [
    {
      name: 'Score',
      value: percentage,
      fill: color,
    },
  ];

  return (
    <div className="relative w-64 h-64 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            cornerRadius={10}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-5xl font-bold"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground">
          sur {maxScore}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Error State Component
// ============================================

interface ErrorStateProps {
  error: WouakaSdkError;
  onRetry: () => void;
  isRetrying: boolean;
}

function ErrorState({ error, onRetry, isRetrying }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="max-w-md mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur de chargement</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{error.message}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          Réessayer
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// Main Dashboard Component
// ============================================

export default function UserScoreDashboard() {
  const [userInfo] = useState<UserInfo>({
    name: 'Kouassi Jean-Baptiste',
    email: 'jean.kouassi@example.com',
    kycStatus: 'verified',
    kycLevel: 'basic',
  });
  
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [error, setError] = useState<WouakaSdkError | null>(null);
  
  const { 
    calculateScore, 
    isLoading, 
    error: sdkError,
    reset 
  } = useWouakaScore({ showToasts: false });

  const loadScore = useCallback(async () => {
    setError(null);
    try {
      const result = await calculateScore({
        phone_number: '+22507XXXXXXXX',
        full_name: userInfo.name,
      });
      
      if (result) {
        // CORRECTION : On utilise le score direct (0-100)
        setScoreData({
          score: Math.round(result.score), 
          grade: result.grade,
          risk_category: result.risk_category,
          confidence: result.confidence,
          calculated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(parseWouakaSdkError(err));
    }
  }, [calculateScore, userInfo.name]);

  useEffect(() => {
    loadScore();
  }, [loadScore]);

  useEffect(() => {
    if (sdkError) setError(sdkError);
  }, [sdkError]);

  const handleRetry = useCallback(() => {
    reset();
    loadScore();
  }, [reset, loadScore]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userInfo.name}</h1>
              {userInfo.email && (
                <p className="text-sm text-muted-foreground">{userInfo.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Statut KYC:</span>
            <KycStatusBadge status={userInfo.kycStatus} />
          </div>
        </header>

        {error && !isLoading && (
          <ErrorState error={error} onRetry={handleRetry} isRetrying={isLoading} />
        )}

        {isLoading && !error && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2"><ScoreSkeletonCard /></div>
            <div className="space-y-4"><StatsSkeletonCard /><StatsSkeletonCard /></div>
          </div>
        )}

        {!isLoading && !error && scoreData && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-5"
                style={{ 
                  background: `radial-gradient(circle at 50% 0%, ${getScoreColor(scoreData.score)}, transparent 70%)` 
                }}
              />
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-primary" />
                  Score de Crédit WOUAKA
                </CardTitle>
                <CardDescription>Échelle de 0 à 100 points</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScoreGauge score={scoreData.score} />
                <div className="text-center mt-4">
                  <Badge 
                    variant="outline" 
                    className="text-lg px-4 py-1"
                    style={{ borderColor: getScoreColor(scoreData.score), color: getScoreColor(scoreData.score) }}
                  >
                    {getRiskLabel(scoreData.score)}
                  </Badge>
                </div>
                <div className="flex justify-center gap-8 mt-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <p className="text-2xl font-bold">{scoreData.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fiabilité</p>
                    <p className="text-2xl font-bold">{scoreData.confidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold capitalize">{scoreData.risk_category.replace('_', ' ')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Mis à jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scoreData.calculated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
              <Button variant="outline" className="w-full gap-2" onClick={handleRetry} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
