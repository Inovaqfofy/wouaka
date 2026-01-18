import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileCheck, 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useKycRequests, useKycStats } from "@/hooks/useEnterpriseKyc";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PartnerKyc = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: kycData, isLoading } = useKycRequests({ search: searchQuery });
  const { data: kycStats } = useKycStats();

  const kycRequests = kycData?.requests || [];
  const filteredKyc = kycRequests;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Validé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string | null) => {
    if (!riskLevel) return null;
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Faible</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
      case 'high':
        return <Badge variant="destructive">Élevé</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const stats = {
    total: kycStats?.total || 0,
    pending: kycStats?.pending || 0,
    completed: kycStats?.verified || 0,
    highRisk: kycRequests.filter(k => k.risk_level === 'high').length || 0,
  };

  return (
    <DashboardLayout role="partner" title="Vérifications KYC">
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
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total KYC</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Validés</p>
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
                  <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
                  <p className="text-sm text-muted-foreground">Risque élevé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KYC List */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes KYC</CardTitle>
            <CardDescription>Gérez les vérifications d'identité de vos clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredKyc.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune demande KYC</h3>
                <p className="text-muted-foreground">
                  Aucune demande de vérification ne correspond à vos critères
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredKyc.map((kyc) => (
                  <div 
                    key={kyc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{kyc.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {kyc.national_id || '--'} • {format(new Date(kyc.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getRiskBadge(kyc.risk_level || null)}
                      {getStatusBadge(kyc.status)}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/partner/kyc/${kyc.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Examiner
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerKyc;
