import { useState } from "react";
import { 
  Search, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Database,
  TrendingUp
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
import { Skeleton } from "@/components/ui/skeleton";
import { useClientProfiles, useAnalystStats } from "@/hooks/useAnalystStats";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const PAGE_SIZE = 10;

const AnalystClients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data: stats } = useAnalystStats();
  const { data, isLoading } = useClientProfiles({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  });

  // Score scale: 0-100
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (riskScore: number | null) => {
    if (!riskScore) return <Badge variant="outline">N/A</Badge>;
    if (riskScore <= 30) return <Badge variant="success">Faible</Badge>;
    if (riskScore <= 60) return <Badge variant="warning">Moyen</Badge>;
    return <Badge variant="destructive">Élevé</Badge>;
  };

  return (
    <DashboardLayout role="analyst" title="Clients">
      <div className="space-y-6">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <div className="text-2xl font-bold">{stats?.assignedClients || 0}</div>
              </div>
              <p className="text-sm text-muted-foreground">Total clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <div className="text-2xl font-bold">
                  {data?.clients.reduce((acc, c) => acc + (c.dataSources?.length || 0), 0) || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Sources de données</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <div className="text-2xl font-bold text-success">
                  {data?.clients.filter(c => (c.compositeScore || 0) >= 70).length || 0}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Score élevé (70+)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {data?.clients.reduce((acc, c) => acc + (c.enrichmentCount || 0), 0) || 0}
              </div>
              <p className="text-sm text-muted-foreground">Enrichissements</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Profils clients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Score Composite</TableHead>
                      <TableHead>Fiabilité</TableHead>
                      <TableHead>Stabilité</TableHead>
                      <TableHead>Risque</TableHead>
                      <TableHead>Sources</TableHead>
                      <TableHead>Enrichissements</TableHead>
                      <TableHead>Mis à jour</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {client.reference}
                        </TableCell>
                        <TableCell>
                          <span className={`text-lg font-bold ${getScoreColor(client.compositeScore)}`}>
                            {client.compositeScore || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getScoreColor(client.reliabilityScore)}>
                            {client.reliabilityScore || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getScoreColor(client.stabilityScore)}>
                            {client.stabilityScore || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(client.riskScore)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {client.dataSources.length} sources
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {client.enrichmentCount || 0}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.lastEnrichedAt 
                            ? formatDistanceToNow(new Date(client.lastEnrichedAt), { addSuffix: true, locale: fr })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.clients || data.clients.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Aucun client trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage + 1} sur {data.totalPages} ({data.totalCount} résultats)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(data.totalPages - 1, p + 1))}
                        disabled={currentPage >= data.totalPages - 1}
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalystClients;
