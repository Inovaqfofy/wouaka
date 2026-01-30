import { useState } from "react";
import { 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileCheck
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
import { useAllKycValidations } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }> = {
  approved: { label: "Approuvé", variant: "success", icon: CheckCircle },
  pending: { label: "En attente", variant: "warning", icon: Clock },
  rejected: { label: "Rejeté", variant: "destructive", icon: XCircle },
};

const AdminKyc = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: validations, isLoading } = useAllKycValidations();

  const filteredValidations = validations?.filter(v => {
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesStatus;
  }) || [];

  const pendingCount = validations?.filter(v => v.status === "pending").length || 0;
  const approvedCount = validations?.filter(v => v.status === "approved").length || 0;
  const rejectedCount = validations?.filter(v => v.status === "rejected").length || 0;

  return (
    <DashboardLayout role="admin" title="Validations KYC">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{validations?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total validations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{approvedCount}</div>
              <p className="text-sm text-muted-foreground">Approuvées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
              <p className="text-sm text-muted-foreground">Rejetées</p>
            </CardContent>
          </Card>
        </div>

        {/* Validations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des validations</CardTitle>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Identité</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValidations.map((validation) => {
                    const status = statusConfig[validation.status || "pending"];
                    const StatusIcon = status?.icon || Clock;
                    return (
                      <TableRow key={validation.id}>
                        <TableCell className="font-mono text-sm">
                          {validation.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {validation.identity_verified ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {validation.address_verified ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {validation.documents_complete ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {validation.overall_score ? (
                            <span className="font-semibold">{validation.overall_score}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status?.variant || "default"} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status?.label || "En attente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(validation.created_at).toLocaleDateString("fr-FR")}
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
                  {filteredValidations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucune validation trouvée
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

export default AdminKyc;
