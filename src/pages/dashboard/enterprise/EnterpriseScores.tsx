import { 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MonthlyScoresChart } from "@/components/charts/ScoreChart";
import { ScoreCard } from "@/components/cards/ScoreCard";

// Score scale: 0-100 with grades E to A+
const scoreHistory = [
  { date: "2024-01", score: 68, grade: "B+" },
  { date: "2024-02", score: 70, grade: "A" },
  { date: "2024-03", score: 71, grade: "A" },
  { date: "2024-04", score: 72, grade: "A" },
  { date: "2024-05", score: 74, grade: "A" },
];

const scoreFactors = [
  { name: "Historique de paiement", score: 85, impact: "positive" },
  { name: "Utilisation du crédit", score: 72, impact: "positive" },
  { name: "Ancienneté du crédit", score: 65, impact: "neutral" },
  { name: "Diversité des crédits", score: 58, impact: "negative" },
  { name: "Nouvelles demandes", score: 90, impact: "positive" },
];

const EnterpriseScores = () => {
  const currentScore = scoreHistory[scoreHistory.length - 1];
  const previousScore = scoreHistory[scoreHistory.length - 2];
  const scoreChange = currentScore.score - previousScore.score;

  return (
    <DashboardLayout role="enterprise" title="Mes scores">
      <div className="space-y-6">
        {/* Current Score Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ScoreCard
            score={currentScore.score}
            grade={currentScore.grade}
            reliability={88}
            sourcesCount={7}
            trend="up"
          />

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Évolution du score</CardTitle>
                  <CardDescription>Progression sur les 6 derniers mois</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {scoreChange > 0 ? (
                    <Badge variant="success" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{scoreChange} pts
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {scoreChange} pts
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <MonthlyScoresChart title="" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Facteurs de score</CardTitle>
                <CardDescription>
                  Éléments qui influencent votre score de crédit
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter le rapport
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoreFactors.map((factor) => (
                <div key={factor.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <span className="text-sm text-muted-foreground">{factor.score}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          factor.impact === "positive" ? "bg-success" :
                          factor.impact === "negative" ? "bg-destructive" : "bg-warning"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                  <Badge 
                    variant={
                      factor.impact === "positive" ? "success" :
                      factor.impact === "negative" ? "destructive" : "secondary"
                    }
                  >
                    {factor.impact === "positive" ? "Positif" :
                     factor.impact === "negative" ? "À améliorer" : "Neutre"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {scoreHistory.map((entry, index) => (
                <div 
                  key={entry.date}
                  className={`p-4 rounded-xl text-center ${
                    index === scoreHistory.length - 1 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-sm opacity-80 mb-2">
                    <Calendar className="w-3 h-3" />
                    {entry.date}
                  </div>
                  <div className="text-2xl font-bold">{entry.score}</div>
                  <Badge 
                    variant={index === scoreHistory.length - 1 ? "secondary" : "outline"}
                    className="mt-2"
                  >
                    {entry.grade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations pour améliorer votre score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                <h4 className="font-semibold text-success mb-2">Points forts</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Excellent historique de paiement</li>
                  <li>• Peu de nouvelles demandes de crédit</li>
                  <li>• Bonne utilisation du crédit disponible</li>
                </ul>
              </div>
              <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                <h4 className="font-semibold text-warning mb-2">À améliorer</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Diversifier les types de crédit</li>
                  <li>• Augmenter l'ancienneté moyenne des comptes</li>
                  <li>• Maintenir un ratio d'utilisation sous 30%</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseScores;
