/**
 * UserScoreDashboard - Dashboard utilisateur WOUAKA
 * Version Finale Optimisée avec Historique des Prêts
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
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

// Import de tes nouveaux composants
import { LoanApplicationModal } from '@/components/loan/LoanApplicationModal';
import { LoanHistoryTable, type LoanApplication } from '@/components/loan/LoanHistoryTable';

// ============================================
// Types
// ============================================

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  kycStatus: 'pending' | 'verified' | 'rejected' | 'expired';
}

interface ScoreData {
  score: number;
  grade: string;
  risk_category: string;
  confidence: number;
  calculated_at: string;
}

// ============================================
// Helpers Visuels
// ============================================

function getScoreColor(score: number): string {
  if (score < 30) return '#ef4444';
  if (score < 60) return '#f97316';
  return '#22c55e';
}

function getRiskLabel(score: number): string {
  if (score < 30) return 'Risque élevé';
  if (score < 60) return 'Risque modéré';
  return 'Risque faible';
}

// ============================================
// Main Component
// ============================================

export default function UserScoreDashboard() {
  // 1. États
  const [userInfo] = useState<UserInfo>({
    id: 'user_123',
    name: 'Kouassi Jean-Baptiste',
    email: 'jean.kouassi@example.com',
    kycStatus: 'verified',
  });
  
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [error, setError] = useState<WouakaSdkError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Simulation d'un historique initial
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([
    { 
      id: 'loan_001', 
      amount: 150000, 
      date: new Date(Date.now() - 86400000 * 5).toISOString(), 
      status: 'approved', 
      duration: 6 
    }
  ]);

  // 2. Hook SDK
  const { calculateScore, isLoading, error: sdkError, reset } = useWouakaScore({ showToasts: false });

  // 3. Chargement des données
  const loadScore = useCallback(async () => {
    setError(null);
    try {
      const result = await calculateScore({ 
        phone_number: '+22507XXXXXXXX', 
        full_name: userInfo.name 
      });
      if (result) {
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

  useEffect(() => { loadScore(); }, [loadScore]);
  useEffect(() => { if (sdkError) setError(sdkError); }, [sdkError]);

  const handleRetry = useCallback(() => { reset(); loadScore(); }, [reset, loadScore]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Utilisateur */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userInfo.name}</h1>
              <p className="text-sm text-muted-foreground">{userInfo.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="default" className="bg-green-500 hover:bg-green-600">
               <CheckCircle2 className="h-3 w-3 mr-1" /> KYC Vérifié
             </Badge>
          </div>
        </header>

        {/* Gestion des Erreurs */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de synchronisation</AlertTitle>
            <AlertDescription className="flex items-center justify-between w-full">
              {error.message}
              <Button size="sm" variant="outline" onClick={handleRetry} className="ml-4">
                <RefreshCw className="h-3 w-3 mr-2" /> Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Skeleton pendant le chargement */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2"><ScoreSkeletonCard /></div>
            <div className="space-y-4"><StatsSkeletonCard /><StatsSkeletonCard /></div>
          </div>
        )}

        {/* Dashboard Principal */}
        {!isLoading && !error && scoreData && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Colonne Gauche : Score et Éligibilité */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Jauge de Score */}
                <Card className="relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${getScoreColor(scoreData.score)}, transparent 70%)` }}
                  />
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Score de Crédit WOUAKA
                    </CardTitle>
                    <CardDescription>Analyse en temps réel de votre fiabilité</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-64 h-64 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" 
                          barSize={20} data={[{ value: scoreData.score, fill: getScoreColor(scoreData.score) }]} 
                          startAngle={180} endAngle={0}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <span className="text-5xl font-bold" style={{ color: getScoreColor(scoreData.score) }}>{scoreData.score}</span>
                        <Badge variant="outline" className="mt-2" style={{ borderColor: getScoreColor(scoreData.score), color: getScoreColor(scoreData.score) }}>
                          {getRiskLabel(scoreData.score)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carte d'Éligibilité Prêt */}
                <Card className="border-l-4" style={{ borderLeftColor: getScoreColor(scoreData.score) }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" style={{ color: getScoreColor(scoreData.score) }} />
                      Offre de Financement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {scoreData.score >= 50 
                        ? "Félicitations ! Votre profil vous permet de simuler un prêt dès maintenant." 
                        : "Votre score est un peu bas. Continuez vos transactions pour débloquer les prêts."}
                    </p>
                    <Button 
                      className="w-full" 
                      style={{ backgroundColor: scoreData.score >= 30 ? getScoreColor(scoreData.score) : '#ccc', color: 'white' }}
                      disabled={scoreData.score < 30}
                      onClick={() => setIsModalOpen(true)}
                    >
                      Demander un prêt
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne Droite : Widgets Infos */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Analyse</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Grade Actuel</p>
                        <p className="text-2xl font-bold">{scoreData.grade}</p>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground uppercase">Fiabilité</p>
                        <p className="text-2xl font-bold">{scoreData.confidence}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mise à jour</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(scoreData.calculated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-4 text-xs h-8" onClick={handleRetry}>
                      <RefreshCw className="h-3 w-3 mr-2" /> Actualiser
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Historique des Demandes (Sous le dashboard) */}
            <div className="pt-6">
              <LoanHistoryTable applications={loanApplications} />
            </div>
          </>
        )}

        {/* Modale de Prêt */}
        <LoanApplicationModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          score={scoreData?.score || 0} 
          userId={userInfo.id}
        />
      </div>
    </div>
  );
}
