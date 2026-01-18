import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Activity, 
  Shield, 
  Mail, 
  Search, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Smartphone,
  FileText,
  Zap,
  RefreshCw,
  Eye,
  User
} from "lucide-react";
import { 
  useKycHealthMetrics,
  useScoringMetrics,
  useMobileTrustMetrics,
  useEdgeFunctionMetrics,
  useEmailLogMetrics,
  useOcrErrors,
  useUserInvestigation,
} from "@/hooks/useMonitoringStats";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const AIMonitoring = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data: kycHealth, isLoading: kycLoading, refetch: refetchKyc } = useKycHealthMetrics();
  const { data: scoringMetrics, isLoading: scoringLoading, refetch: refetchScoring } = useScoringMetrics();
  const { data: mobileTrust, isLoading: mobileLoading, refetch: refetchMobile } = useMobileTrustMetrics();
  const { data: edgeFunctions, isLoading: edgeLoading, refetch: refetchEdge } = useEdgeFunctionMetrics();
  const { data: emailLogs, isLoading: emailLoading, refetch: refetchEmail } = useEmailLogMetrics();
  const { data: ocrErrors, isLoading: ocrLoading, refetch: refetchOcr } = useOcrErrors(10);
  const { data: searchResults, isLoading: searchLoading } = useUserInvestigation(activeSearch);

  const handleRefreshAll = () => {
    refetchKyc();
    refetchScoring();
    refetchMobile();
    refetchEdge();
    refetchEmail();
    refetchOcr();
  };

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  return (
    <DashboardLayout role="admin" title="Monitoring IA - SUPER ADMIN">
      <div className="space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/60 rounded-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Dashboard Monitoring IA</h2>
              <p className="text-sm text-muted-foreground">Supervision temps réel des 100 premiers utilisateurs</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="health" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Santé Système
            </TabsTrigger>
            <TabsTrigger value="infra" className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Infrastructure
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Investigation
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Erreurs IA
            </TabsTrigger>
          </TabsList>

          {/* HEALTH TAB */}
          <TabsContent value="health" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KYC Health */}
              <Card className={`border-2 ${kycHealth?.isAlert ? 'border-destructive bg-destructive/5' : 'border-green-500/30 bg-green-500/5'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Santé KYC / OCR
                    </CardTitle>
                    {kycHealth?.isAlert ? (
                      <Badge variant="destructive" className="animate-pulse">ALERTE</Badge>
                    ) : (
                      <Badge className="bg-green-500">OK</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {kycLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{kycHealth?.successRate || 0}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Taux de succès OCR ({kycHealth?.validatedDocuments}/{kycHealth?.totalDocuments})
                      </p>
                      {kycHealth?.isAlert && (
                        <p className="text-xs text-destructive mt-2">
                          ⚠️ Taux de rejet &gt; 20% ({kycHealth?.rejectionRate}%)
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Scoring Precision */}
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Précision Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scoringLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{scoringMetrics?.averageConfidence || 0}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Indice de confiance moyen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Score moyen: {scoringMetrics?.averageScore || 0}/850
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Trust */}
              <Card className="border-gold/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gold" />
                    Mobile Trust
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mobileLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{mobileTrust?.ussdCniCorrelationSuccess || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Corrélations USSD/CNI réussies
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Taux: {mobileTrust?.successRate || 0}% | SMS: {mobileTrust?.smsAnalyzed || 0}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Email Status */}
              <Card className="border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Emails Automatisés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emailLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">{emailLogs?.delivered || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emails délivrés
                      </p>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className="text-green-500">✓ {emailLogs?.delivered || 0}</span>
                        <span className="text-destructive">✗ {emailLogs?.failed || 0}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* KYC Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tendance KYC (7 jours)</CardTitle>
                  <CardDescription>Documents validés vs rejetés</CardDescription>
                </CardHeader>
                <CardContent>
                  {kycLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={kycHealth?.trend || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area type="monotone" dataKey="validated" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Validés" />
                        <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Rejetés" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition des Scores</CardTitle>
                  <CardDescription>Distribution par catégorie ({scoringMetrics?.totalScores || 0} scores)</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoringLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={scoringMetrics?.distribution || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="range" type="category" width={120} className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INFRASTRUCTURE TAB */}
          <TabsContent value="infra" className="space-y-6">
            {/* Edge Functions Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Performance des Edge Functions
                </CardTitle>
                <CardDescription>Temps de réponse moyen et taux de succès</CardDescription>
              </CardHeader>
              <CardContent>
                {edgeLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(edgeFunctions || []).map((func, index) => (
                      <div key={func.functionName} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{func.functionName}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground">{func.callCount} appels</span>
                              <Badge variant={func.successRate >= 95 ? "default" : func.successRate >= 80 ? "secondary" : "destructive"}>
                                {func.successRate}%
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(func.avgLatency / 5, 100)} className="flex-1 h-2" />
                            <span className={`text-xs font-mono ${func.avgLatency > 300 ? 'text-destructive' : func.avgLatency > 150 ? 'text-amber-500' : 'text-green-500'}`}>
                              {func.avgLatency}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Logs by Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Suivi des Emails par Template
                </CardTitle>
                <CardDescription>Statut des envois automatisés ({emailLogs?.total || 0} total)</CardDescription>
              </CardHeader>
              <CardContent>
                {emailLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Délivrés", value: emailLogs?.delivered || 0 },
                            { name: "Échecs", value: emailLogs?.failed || 0 },
                            { name: "En attente", value: emailLogs?.pending || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {(emailLogs?.byTemplate || []).map((t, i) => (
                        <div key={t.template} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm font-medium capitalize">{t.template.replace(/_/g, " ")}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t.count}</span>
                            <Badge variant={t.successRate >= 95 ? "default" : "destructive"} className="text-xs">
                              {t.successRate}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPORT / INVESTIGATION TAB */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Investigation de Profil Utilisateur
                </CardTitle>
                <CardDescription>
                  Rechercher un utilisateur par email, téléphone ou nom pour inspecter son dossier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Email, téléphone ou nom (min 3 caractères)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="max-w-md"
                  />
                  <Button onClick={handleSearch} disabled={searchQuery.length < 3}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                {searchLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((user) => (
                      <Card key={user.id} className="border-muted">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{user.fullName || "Non renseigné"}</h4>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-xs text-muted-foreground">Tél: {user.phone || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">Inscrit le: {user.createdAt}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant={
                                user.kycStatus === "approved" ? "default" :
                                user.kycStatus === "pending" ? "secondary" : "destructive"
                              }>
                                KYC: {user.kycStatus || "Non initié"}
                              </Badge>
                              {user.scoreValue && (
                                <div className="text-sm">
                                  <span className="font-semibold">{user.scoreValue}</span>
                                  <span className="text-muted-foreground text-xs"> ({user.scoreConfidence}% conf.)</span>
                                </div>
                              )}
                              {user.trustLevel && (
                                <Badge variant="outline" className="capitalize">{user.trustLevel}</Badge>
                              )}
                            </div>
                          </div>
                          {user.certificateId && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              Certificat: {user.certificateId.slice(0, 8).toUpperCase()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : activeSearch ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun utilisateur trouvé pour "{activeSearch}"</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Entrez un terme de recherche pour inspecter un profil</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ERRORS TAB */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  10 Derniers Échecs OCR / Fraude
                </CardTitle>
                <CardDescription>
                  Analyse des erreurs pour identifier les problèmes (luminosité, type de document, fraude)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ocrLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : ocrErrors && ocrErrors.length > 0 ? (
                  <div className="space-y-3">
                    {ocrErrors.map((error, index) => (
                      <div key={error.id} className="flex items-start gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="p-2 bg-destructive/10 rounded">
                          <XCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{error.checkType}</span>
                            <span className="text-xs text-muted-foreground">{error.createdAt}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{error.details}</p>
                          {error.documentId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Doc ID: {error.documentId.slice(0, 8).toUpperCase()}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>Aucune erreur OCR récente détectée</p>
                    <p className="text-xs">Le système fonctionne normalement</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIMonitoring;
