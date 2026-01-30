import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  User,
  TrendingUp,
  FileCheck,
  History,
  AlertTriangle,
  RefreshCw,
  Plus,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useClientProfile, useClientEvaluations, useClientActions } from "@/hooks/useClientProfile";
import { useState } from "react";
import { NewEvaluationWizard } from "@/components/enterprise/NewEvaluationWizard";

const PartnerClientDetail = () => {
  const { clientId } = useParams();
  const [showWizard, setShowWizard] = useState(false);
  
  const { data: client, isLoading } = useClientProfile(clientId);
  const { data: evaluations, isLoading: evaluationsLoading } = useClientEvaluations(clientId);
  const { recalculateScore, requestKyc, enrichData } = useClientActions();

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleRecalculate = () => {
    if (clientId) {
      recalculateScore.mutate(clientId);
    }
  };

  const handleRequestKyc = () => {
    if (clientId && client) {
      requestKyc.mutate({
        clientId,
        fullName: client.fullName || client.externalReference,
        phoneNumber: client.phoneNumber || undefined,
        nationalId: client.nationalId || undefined,
      });
    }
  };

  const handleEnrich = () => {
    if (clientId) {
      enrichData.mutate(clientId);
    }
  };

  return (
    <DashboardLayout role="partner" title="Détail Client">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link to="/dashboard/partner/clients">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          </div>
        ) : !client ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Client non trouvé</h3>
              <p className="text-muted-foreground">
                Ce client n'existe pas ou vous n'y avez pas accès.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Client Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{client.fullName || client.externalReference}</h2>
                      <p className="text-muted-foreground">
                        Réf: {client.externalReference} • {client.dataSources?.length || 0} sources de données • {client.enrichmentCount || 0} enrichissements
                      </p>
                      {client.phoneNumber && (
                        <p className="text-sm text-muted-foreground">
                          📱 {client.phoneNumber}
                          {client.nationalId && ` • 🪪 ${client.nationalId}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Score composite</p>
                    <p className={`text-4xl font-bold ${getScoreColor(client.compositeScore)}`}>
                      {client.compositeScore || '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${getScoreColor(client.compositeScore)}`}>
                        {client.compositeScore || '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">Score Global</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{client.reliabilityScore || '--'}</p>
                      <p className="text-sm text-muted-foreground">Fiabilité</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <History className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{client.stabilityScore || '--'}</p>
                      <p className="text-sm text-muted-foreground">Stabilité</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{client.riskScore ? `${client.riskScore}%` : '--'}</p>
                      <p className="text-sm text-muted-foreground">Risque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Sources de Données</CardTitle>
                <CardDescription>Données utilisées pour le calcul du score</CardDescription>
              </CardHeader>
              <CardContent>
                {client.dataSources && client.dataSources.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {client.dataSources.map((source) => (
                      <Badge key={source} variant="outline" className="text-sm">
                        {source}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune source de données</p>
                )}
                {client.lastEnrichedAt && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Dernier enrichissement: {format(new Date(client.lastEnrichedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Evaluations History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historique des Évaluations</CardTitle>
                  <CardDescription>Évaluations de scoring et de vérification effectuées pour ce client</CardDescription>
                </div>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle évaluation
                </Button>
              </CardHeader>
              <CardContent>
                {evaluationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !evaluations || evaluations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune évaluation pour ce client
                  </p>
                ) : (
                  <div className="space-y-3">
                    {evaluations.map((ev) => (
                      <div 
                        key={ev.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ev.type === 'score' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                            {ev.type === 'score' ? (
                              <TrendingUp className={`w-4 h-4 ${ev.type === 'score' ? 'text-orange-600' : 'text-blue-600'}`} />
                            ) : (
                              <FileCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {ev.type === 'score' ? 'Scoring Crédit' : 'Vérification Identité'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(ev.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {ev.score && (
                            <div className="text-right">
                              <p className="font-bold">{ev.score}</p>
                              {ev.grade && <Badge>{ev.grade}</Badge>}
                            </div>
                          )}
                          <Badge variant={ev.status === 'completed' ? 'default' : 'secondary'}>
                            {ev.status === 'completed' ? 'Terminé' : ev.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={ev.type === 'score' 
                              ? `/dashboard/partner/evaluations/${ev.id}` 
                              : `/dashboard/partner/kyc/${ev.id}`
                            }>
                              Voir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <Button 
                  onClick={handleRecalculate}
                  disabled={recalculateScore.isPending}
                >
                  {recalculateScore.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Recalculer le score
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRequestKyc}
                  disabled={requestKyc.isPending}
                >
                  {requestKyc.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4 mr-2" />
                  )}
                  Demander KYC
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleEnrich}
                  disabled={enrichData.isPending}
                >
                  {enrichData.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Enrichir les données
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <NewEvaluationWizard 
        open={showWizard} 
        onOpenChange={setShowWizard}
      />
    </DashboardLayout>
  );
};

export default PartnerClientDetail;
