import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBorrowerApplications } from "@/hooks/useBorrowerData";

const BorrowerApplications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: applications = [], isLoading } = useBorrowerApplications();

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.provider_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Refusée</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">En cours d'examen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (!score) return <span className="text-muted-foreground">--</span>;
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">{score}</Badge>;
    if (score >= 55) return <Badge className="bg-yellow-100 text-yellow-800">{score}</Badge>;
    return <Badge variant="destructive">{score}</Badge>;
  };

  return (
    <DashboardLayout role="borrower" title="Mes Candidatures">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
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
                  <p className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'pending').length}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'approved').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'rejected').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Refusées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <CardTitle>Mes Candidatures</CardTitle>
            <CardDescription>
              Suivez l'état de toutes vos demandes de financement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="under_review">En examen</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0 
                    ? "Vous n'avez pas encore soumis de candidature"
                    : "Aucune candidature ne correspond à vos critères"}
                </p>
                <Button asChild>
                  <Link to="/dashboard/borrower/offers">
                    Explorer les offres
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div 
                    key={app.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.provider_name} • Soumise le {format(new Date(app.created_at || ''), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Score: </span>
                        {getScoreBadge(app.score || null)}
                      </div>
                      {getStatusBadge(app.status || 'pending')}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
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

export default BorrowerApplications;
