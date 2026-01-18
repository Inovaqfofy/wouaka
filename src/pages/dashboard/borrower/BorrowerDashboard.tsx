import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, 
  FileText, 
  ClipboardList, 
  Store, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrustLevelBadge, getTrustLevelFromProofs } from "@/components/trust";
import { ProofProgressIndicator, ProofStatus } from "@/components/trust";
import { useBorrowerScore, useBorrowerApplications, useBorrowerOffersCount, useBorrowerDocuments } from "@/hooks/useBorrowerData";
import { useBorrowerProofStatus } from "@/hooks/useBorrowerProofStatus";

const BorrowerDashboard = () => {
  const { profile } = useAuth();
  const { data: scoreData, isLoading: scoreLoading } = useBorrowerScore();
  const { data: myApplications = [], isLoading: applicationsLoading } = useBorrowerApplications();
  const { data: offersCount = 0, isLoading: offersLoading } = useBorrowerOffersCount();
  const { proofStatus, isLoading: proofLoading } = useBorrowerProofStatus();

  const isLoading = applicationsLoading;
  const pendingApplications = myApplications.filter(app => app.status === 'pending');
  const approvedApplications = myApplications.filter(app => app.status === 'approved');
  const rejectedApplications = myApplications.filter(app => app.status === 'rejected');

  const trustLevel = getTrustLevelFromProofs(proofStatus);
  const certaintyCoefficient = scoreData?.confidence || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800">Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">En cours d'examen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="borrower" title="Mon Espace de Confiance">
      <div className="space-y-6">
        {/* Welcome Section with Trust Level */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Bienvenue, {profile?.full_name || 'Emprunteur'} 👋
              </h2>
              <p className="text-muted-foreground mt-1">
                Renforcez vos preuves pour améliorer votre niveau de confiance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TrustLevelBadge level={trustLevel} showDescription size="lg" />
            </div>
          </div>
        </div>

        {/* Quick Stats with Trust Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Niveau de Confiance</p>
                  <div className="mt-1">
                    <TrustLevelBadge level={trustLevel} size="sm" showScore />
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Link to="/dashboard/borrower/score" className="text-xs text-primary hover:underline mt-2 inline-block">
                Voir mon certificat →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Coefficient de Certitude</p>
                  <p className="text-2xl font-bold text-secondary">
                    {scoreLoading ? '--' : `${Math.round(certaintyCoefficient * 100)}%`}
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Fiabilité de vos preuves
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mes Preuves</p>
                  <p className="text-2xl font-bold">
                    {Object.values(proofStatus).filter(Boolean).length}/5
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <Link to="/dashboard/borrower/documents" className="text-xs text-primary hover:underline mt-2 inline-block">
                Gérer →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offres disponibles</p>
                  <p className="text-2xl font-bold">{offersLoading ? '--' : offersCount}</p>
                </div>
                <div className="p-3 bg-[#D4A017]/10 rounded-full">
                  <Store className="w-6 h-6 text-[#D4A017]" />
                </div>
              </div>
              <Link to="/dashboard/borrower/offers" className="text-xs text-primary hover:underline mt-2 inline-block">
                Explorer →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proof Progress Indicator */}
          <ProofProgressIndicator 
            proofStatus={proofStatus} 
            showActions={true}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
              <CardDescription>Renforcez votre dossier de preuves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/dashboard/borrower/score" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg hover:from-primary/10 hover:to-primary/20 transition-colors">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Mon Certificat de Solvabilité</p>
                    <p className="text-sm text-muted-foreground">Score avec coefficient de certitude</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>

              <Link to="/dashboard/borrower/documents" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 transition-colors">
                  <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Soumettre des preuves</p>
                    <p className="text-sm text-muted-foreground">Capture USSD, SMS, documents</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>

              <Link to="/dashboard/borrower/offers" className="block">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-lg hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/40 dark:hover:to-emerald-800/40 transition-colors">
                  <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                    <Store className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Accéder aux offres</p>
                    <p className="text-sm text-muted-foreground">Partagez votre dossier certifié</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mes Candidatures Récentes</CardTitle>
              <CardDescription>Suivez l'état de vos demandes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/borrower/applications">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune candidature pour le moment</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/dashboard/borrower/offers">Explorer les offres</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{app.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.provider_name} • {format(new Date(app.created_at || ''), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    {getStatusBadge(app.status || 'pending')}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé de mes candidatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{pendingApplications.length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{approvedApplications.length}</p>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <AlertCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{myApplications.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BorrowerDashboard;
