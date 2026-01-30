import { useState } from "react";
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Award
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
import { useAllCertificates } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

const trustLevelConfig: Record<string, { label: string; variant: "default" | "secondary" | "warning" }> = {
  gold: { label: "Or", variant: "default" },
  silver: { label: "Argent", variant: "secondary" },
  bronze: { label: "Bronze", variant: "warning" },
};

const AdminCertificates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: certificates, isLoading } = useAllCertificates();

  const getHolderName = (cert: Record<string, unknown>) => {
    const profiles = cert.profiles as { full_name?: string } | null;
    return profiles?.full_name || "—";
  };

  const getHolderPhone = (cert: Record<string, unknown>) => {
    const profiles = cert.profiles as { phone?: string } | null;
    return profiles?.phone || "—";
  };

  const filteredCertificates = certificates?.filter(c => {
    const holderName = getHolderName(c as unknown as Record<string, unknown>);
    const matchesSearch = 
      holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.share_code?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && new Date(c.valid_until) > new Date()) ||
      (statusFilter === "expired" && new Date(c.valid_until) <= new Date());
    return matchesSearch && matchesStatus;
  }) || [];

  const avgCertitude = certificates?.length 
    ? Math.round(certificates.filter(c => c.certainty_coefficient).reduce((sum, c) => sum + (c.certainty_coefficient || 0), 0) / certificates.filter(c => c.certainty_coefficient).length)
    : 0;

  const activeCertificates = certificates?.filter(c => new Date(c.valid_until) > new Date()).length || 0;
  const expiredCertificates = certificates?.filter(c => new Date(c.valid_until) <= new Date()).length || 0;

  return (
    <DashboardLayout role="admin" title="Toutes les certifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code..."
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
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
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
              <div className="text-2xl font-bold">{certificates?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total certificats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{avgCertitude}%</div>
              <p className="text-sm text-muted-foreground">Certitude moyenne</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {activeCertificates}
              </div>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {expiredCertificates}
              </div>
              <p className="text-sm text-muted-foreground">Expirés</p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Historique des certifications
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
                    <TableHead>Code</TableHead>
                    <TableHead>Titulaire</TableHead>
                    <TableHead>Certitude</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Validité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => {
                    const isActive = new Date(cert.valid_until) > new Date();
                    const trustConfig = trustLevelConfig[cert.trust_level || "bronze"] || trustLevelConfig.bronze;
                    
                    return (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">
                          {cert.share_code || cert.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getHolderName(cert as unknown as Record<string, unknown>)}</p>
                            <p className="text-sm text-muted-foreground">{getHolderPhone(cert as unknown as Record<string, unknown>)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cert.certainty_coefficient ? (
                            <span className="font-bold text-lg">{Math.round(cert.certainty_coefficient)}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trustConfig.variant}>
                            {trustConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cert.plan_id?.replace("emprunteur-", "").charAt(0).toUpperCase() + 
                             cert.plan_id?.replace("emprunteur-", "").slice(1) || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "success" : "destructive"}>
                            {isActive ? "Actif" : "Expiré"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(cert.valid_until).toLocaleDateString("fr-FR")}
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
                  {filteredCertificates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun certificat trouvé
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

export default AdminCertificates;
