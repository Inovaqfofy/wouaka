import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Search, 
  Plus,
  Eye,
  BarChart3,
  Calendar,
  FileCheck,
  Target,
  Building2
} from "lucide-react";
import { NewEvaluationWizard } from "@/components/enterprise/NewEvaluationWizard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePartnerEvaluations, usePartnerEvaluationStats } from "@/hooks/usePartnerEvaluations";
import { TrustLevelBadge, getTrustLevelFromScore } from "@/components/trust";

const PartnerEvaluations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();
  
  const { data: evaluations, isLoading } = usePartnerEvaluations();
  const { data: stats } = usePartnerEvaluationStats();

  const filteredEvaluations = evaluations?.filter(ev => 
    ev.clientRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return <Badge variant="outline">--</Badge>;
    const colors: Record<string, string> = {
      'A+': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      'A': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      'B': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'C': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      'D': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      'E': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return <Badge className={colors[grade] || 'bg-gray-100 text-gray-800'}>{grade}</Badge>;
  };

  const getCertaintyColor = (coefficient: number) => {
    if (coefficient >= 0.8) return "text-emerald-600";
    if (coefficient >= 0.6) return "text-blue-600";
    if (coefficient >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout role="partner" title="Dossiers de Preuves Reçus">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Dossiers reçus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Target className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.avgScore ? `${Math.round((stats.avgScore / 100) * 100)}%` : '--'}</p>
                  <p className="text-sm text-muted-foreground">Certitude moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dossiers List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dossiers de Preuves
              </CardTitle>
              <CardDescription>
                Dossiers certifiés reçus de vos clients avec coefficient de certitude
              </CardDescription>
            </div>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Évaluation
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un dossier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun dossier</h3>
                <p className="text-muted-foreground mb-4">
                  {evaluations?.length === 0 
                    ? "Vous n'avez pas encore reçu de dossiers de preuves"
                    : "Aucun dossier ne correspond à votre recherche"}
                </p>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une évaluation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvaluations.map((evaluation) => {
                  const certainty = evaluation.confidence || 0;
                  const trustLevel = evaluation.score ? getTrustLevelFromScore(evaluation.score) : 'unverified';
                  
                  return (
                    <div 
                      key={evaluation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/partner/evaluations/${evaluation.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          {evaluation.score ? (
                            <span className="text-lg font-bold text-primary">{evaluation.score}</span>
                          ) : (
                            <FileCheck className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{evaluation.clientName || evaluation.clientRef}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <TrustLevelBadge level={trustLevel} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(evaluation.date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Certainty coefficient */}
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span className={`font-bold ${getCertaintyColor(certainty)}`}>
                              {Math.round(certainty * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Certitude</p>
                        </div>
                        
                        {/* Grade */}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Grade</p>
                          {getGradeBadge(evaluation.grade)}
                        </div>
                        
                        {/* Status */}
                        <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                          {evaluation.status === 'completed' ? 'Certifié' : 'En cours'}
                        </Badge>
                        
                        {/* Consent status */}
                        {!evaluation.consentActive && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Consentement expiré
                          </Badge>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/partner/evaluations/${evaluation.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/partner/evaluations/${evaluation.id}/proof`);
                            }}
                          >
                            <FileCheck className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewEvaluationWizard 
        open={showWizard} 
        onOpenChange={setShowWizard} 
      />
    </DashboardLayout>
  );
};

export default PartnerEvaluations;
