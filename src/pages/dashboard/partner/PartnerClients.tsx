import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search, 
  Plus,
  Eye,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCustomerProfiles } from "@/hooks/useCustomerProfiles";
import { AddClientDialog } from "@/components/partner/AddClientDialog";

const PartnerClients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles, isLoading } = useCustomerProfiles();

  const filteredClients = profiles?.filter(client => 
    client.externalReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getScoreBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">--</Badge>;
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">{score}</Badge>;
    if (score >= 55) return <Badge className="bg-yellow-100 text-yellow-800">{score}</Badge>;
    return <Badge variant="destructive">{score}</Badge>;
  };

  const getRiskBadge = (riskScore: number | null) => {
    if (!riskScore) return <Badge variant="outline">--</Badge>;
    if (riskScore <= 30) return <Badge className="bg-green-100 text-green-800">Faible</Badge>;
    if (riskScore <= 60) return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
    return <Badge variant="destructive">Élevé</Badge>;
  };

  return (
    <DashboardLayout role="partner" title="Mes Clients">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profiles?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profiles?.filter(p => (p.compositeScore || 0) >= 80).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Score élevé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profiles?.filter(p => (p.riskScore || 0) > 60).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Risque élevé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profiles?.filter(p => p.evaluationsCount && p.evaluationsCount > 0).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Enrichis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Liste des Clients</CardTitle>
              <CardDescription>Gérez vos clients et leurs profils</CardDescription>
            </div>
            <AddClientDialog />
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
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
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {profiles?.length === 0 
                    ? "Commencez par ajouter votre premier client"
                    : "Aucun client ne correspond à votre recherche"}
                </p>
                <AddClientDialog trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un client
                  </Button>
                } />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.fullName || client.externalReference}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.dataSources?.length || 0} sources • {client.evaluationsCount || 0} enrichissements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Score</p>
                        {getScoreBadge(client.compositeScore)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Risque</p>
                        {getRiskBadge(client.riskScore)}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/partner/clients/${client.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
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
      </div>
    </DashboardLayout>
  );
};

export default PartnerClients;
