import { useState } from "react";
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Activity
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
import { useAuditLogs } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  create: { label: "Création", variant: "default" },
  update: { label: "Modification", variant: "secondary" },
  delete: { label: "Suppression", variant: "destructive" },
  login: { label: "Connexion", variant: "outline" },
  logout: { label: "Déconnexion", variant: "outline" },
};

const AdminLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { data: logs, isLoading } = useAuditLogs(100);

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  }) || [];

  return (
    <DashboardLayout role="admin" title="Logs d'audit">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="create">Création</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
                <SelectItem value="login">Connexion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{logs?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total événements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {logs?.filter(l => l.action === "create").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Créations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">
                {logs?.filter(l => l.action === "update").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Modifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {logs?.filter(l => l.action === "delete").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Suppressions</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Journal des événements
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
                    <TableHead>Horodatage</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type d'entité</TableHead>
                    <TableHead>ID Entité</TableHead>
                    <TableHead>Adresse IP</TableHead>
                    <TableHead className="text-right">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const action = actionLabels[log.action] || { label: log.action, variant: "outline" as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={action.variant}>
                            {action.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.entity_type}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.entity_id?.slice(0, 8).toUpperCase() || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {String(log.ip_address) || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun log trouvé
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

export default AdminLogs;
