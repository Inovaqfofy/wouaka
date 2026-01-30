import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { QuotaIndicator } from "@/components/dashboard/QuotaIndicator";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { usePartnerActivity } from "@/hooks/usePartnerActivity";
import { usePartnerApplications } from "@/hooks/usePartnerApplications";
import { 
  Users, 
  TrendingUp, 
  FileCheck, 
  Store,
  ArrowRight,
  Key,
  BarChart3,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCustomerProfiles } from "@/hooks/useCustomerProfiles";
import { useKycStats } from "@/hooks/useEnterpriseKyc";
import { usePartnerOffers } from "@/hooks/usePartnerOffers";
import { useApiCalls } from "@/hooks/useApiCalls";

const PartnerDashboard = () => {
  const { profile } = useAuth();
  const { data: clientsData, isLoading: clientsLoading } = useCustomerProfiles();
  const { data: kycStats, isLoading: kycLoading } = useKycStats();
  const { offers, isLoading: offersLoading } = usePartnerOffers();
  const { apiCalls, isLoading: apiLoading } = useApiCalls();
  const { data: activities, isLoading: activitiesLoading } = usePartnerActivity(6);
  const { stats: appStats, isLoading: appsLoading } = usePartnerApplications();
  
  const isLoading = clientsLoading || kycLoading || offersLoading || apiLoading;

  const stats = {
    totalClients: clientsData?.length || 0,
    pendingKyc: kycStats?.pending || 0,
    activeOffers: offers?.filter(o => o.is_active).length || 0,
    apiCalls: apiCalls?.length || 0
  };

  return (
    <DashboardLayout role="partner" title="Tableau de Bord Partenaire">
      <div className="space-y-6">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Bienvenue, {profile?.full_name || profile?.company || 'Partenaire'} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Recevez des dossiers de preuves certifiées et gérez vos intégrations API.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.totalClients}</p>
                  )}
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Link to="/dashboard/partner/clients" className="text-xs text-primary hover:underline mt-2 inline-block">
                Voir tous →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">KYC en attente</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingKyc}</p>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FileCheck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <Link to="/dashboard/partner/kyc" className="text-xs text-primary hover:underline mt-2 inline-block">
                Traiter →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offres actives</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats.activeOffers}</p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <Link to="/dashboard/partner/offers" className="text-xs text-primary hover:underline mt-2 inline-block">
                Gérer →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Appels API (mois)</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{stats.apiCalls.toLocaleString()}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <Link to="/dashboard/partner/api-usage" className="text-xs text-primary hover:underline mt-2 inline-block">
                Statistiques →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quota Usage */}
        <QuotaIndicator />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Activité Récente</CardTitle>
                <CardDescription>Dernières actions sur votre compte</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === 'application' ? 'bg-green-500' :
                          item.type === 'kyc' ? 'bg-blue-500' :
                          item.type === 'score' ? 'bg-purple-500' :
                          item.type === 'client' ? 'bg-orange-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm">{item.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.relativeTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités clés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/dashboard/partner/evaluations" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg hover:from-primary/10 hover:to-primary/20 transition-colors">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Dossiers de Preuves</p>
                    <p className="text-sm text-muted-foreground">Consultez les dossiers reçus</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>

              <Link to="/dashboard/partner/offers" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <Store className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Créer une Offre</p>
                    <p className="text-sm text-muted-foreground">Publiez sur le marketplace</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>

              <Link to="/dashboard/partner/api-keys" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Key className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Gérer les API</p>
                    <p className="text-sm text-muted-foreground">Clés, webhooks et logs</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tâches en Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/dashboard/partner/kyc" className="flex items-center gap-3 p-4 bg-[#D4A017]/10 rounded-lg hover:bg-[#D4A017]/20 transition-colors">
                <FileCheck className="w-8 h-8 text-[#D4A017]" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingKyc}</p>
                  <p className="text-sm text-muted-foreground">KYC à valider</p>
                </div>
              </Link>
              <Link to="/dashboard/partner/applications" className="flex items-center gap-3 p-4 bg-[#0A3D2C]/5 rounded-lg hover:bg-[#0A3D2C]/10 transition-colors">
                <Users className="w-8 h-8 text-[#0A3D2C]" />
                <div>
                  <p className="text-2xl font-bold">{appsLoading ? '--' : appStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Candidatures à traiter</p>
                </div>
              </Link>
              <Link to="/dashboard/partner/evaluations" className="flex items-center gap-3 p-4 bg-[#D4A017]/10 rounded-lg hover:bg-[#D4A017]/20 transition-colors">
                <TrendingUp className="w-8 h-8 text-[#D4A017]" />
                <div>
                  <p className="text-2xl font-bold">{clientsData?.filter(c => !c.compositeScore).length || 0}</p>
                  <p className="text-sm text-muted-foreground">Clients sans score</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
