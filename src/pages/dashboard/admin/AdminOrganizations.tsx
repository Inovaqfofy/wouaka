import { useState } from "react";
import { 
  Search, 
  Filter,
  Building2,
  Eye,
  Edit,
  MoreHorizontal,
  Users,
  BarChart3,
  CheckCircle,
  XCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminOrganizations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch profiles with company info (organizations)
  const { data: organizations, isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("company", "is", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ["admin-org-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscriptions
  const { data: userSubscriptions } = useQuery({
    queryKey: ["admin-org-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("user_id, status, subscription_plans (name)");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch scoring requests count per organization
  const { data: scoreCounts } = useQuery({
    queryKey: ["admin-org-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_requests")
        .select("user_id")
        .eq("status", "completed");
      
      if (error) throw error;
      
      // Count scores per user
      const counts: Record<string, number> = {};
      data?.forEach(s => {
        if (s.user_id) {
          counts[s.user_id] = (counts[s.user_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const filteredOrgs = organizations?.filter(org => {
    const matchesSearch = 
      (org.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (org.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && org.is_active) ||
      (statusFilter === "inactive" && !org.is_active);
    return matchesSearch && matchesStatus;
  }) || [];

  const activeCount = organizations?.filter(o => o.is_active).length || 0;
  const inactiveCount = organizations?.filter(o => !o.is_active).length || 0;

  return (
    <DashboardLayout role="admin" title="Organisations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une organisation..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{organizations?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Total organisations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">{activeCount}</div>
                  <p className="text-sm text-muted-foreground">Actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{inactiveCount}</div>
                  <p className="text-sm text-muted-foreground">Inactives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {Object.values(scoreCounts || {}).reduce((a, b) => a + b, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Scores générés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Liste des organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Scores</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => {
                    const role = userRoles?.find(r => r.user_id === org.id)?.role || "PARTENAIRE";
                    const subscription = userSubscriptions?.find(s => s.user_id === org.id);
                    const planName = subscription?.subscription_plans?.name || "—";
                    const scoreCount = scoreCounts?.[org.id] || 0;
                    
                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{org.company || "—"}</p>
                              <p className="text-sm text-muted-foreground">{org.full_name || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{org.email}</p>
                            <p className="text-sm text-muted-foreground">{org.phone || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role}</Badge>
                        </TableCell>
                        <TableCell>
                          {subscription ? (
                            <Badge variant={subscription.status === "active" ? "success" : "secondary"}>
                              {planName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Aucun</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{scoreCount}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.is_active ? "success" : "secondary"}>
                            {org.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(org.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="w-4 h-4 mr-2" />
                                Gérer utilisateurs
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredOrgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune organisation trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganizations;
