import { useState } from "react";
import { 
  Search, 
  Filter,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyzedScores, useAnalystStats } from "@/hooks/useAnalystStats";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ScoreTrendChart } from "@/components/charts/ScoreChart";

const gradeConfig = {
  'A+': { variant: 'success' as const, color: 'text-green-600' },
  'A': { variant: 'success' as const, color: 'text-green-500' },
  'B+': { variant: 'default' as const, color: 'text-blue-600' },
  'B': { variant: 'default' as const, color: 'text-blue-500' },
  'C+': { variant: 'warning' as const, color: 'text-yellow-600' },
  'C': { variant: 'warning' as const, color: 'text-yellow-500' },
  'D': { variant: 'destructive' as const, color: 'text-orange-500' },
  'E': { variant: 'destructive' as const, color: 'text-red-500' },
};

const PAGE_SIZE = 10;

const AnalystScores = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data: stats } = useAnalystStats();
  const { data, isLoading } = useAnalyzedScores({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  });

  const filteredScores = data?.scores.filter(score => {
    if (gradeFilter === "all") return true;
    return score.grade === gradeFilter;
  });

  const averageScore = filteredScores?.length 
    ? Math.round(filteredScores.reduce((acc, s) => acc + (s.score || 0), 0) / filteredScores.length)
    : 0;

  return (
    <DashboardLayout role="analyst" title="Scores analysés">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou entreprise..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="E">E</SelectItem>
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
              <div className="text-2xl font-bold">{stats?.analyzedScores || 0}</div>
              <p className="text-sm text-muted-foreground">Scores ce mois</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averageScore}</div>
              <p className="text-sm text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                +12%
              </div>
              <p className="text-sm text-muted-foreground">vs mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {data?.scores.filter(s => (s.confidence || 0) >= 85).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Haute confiance</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart title="" />
          </CardContent>
        </Card>

        {/* Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des scores analysés</CardTitle>
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
                      <TableHead>ID</TableHead>
                      <TableHead>Nom / Entreprise</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Risque</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScores?.map((score) => {
                      const gradeStyle = gradeConfig[score.grade as keyof typeof gradeConfig] || gradeConfig['C'];
                      return (
                        <TableRow key={score.id}>
                          <TableCell className="font-mono text-sm">
                            {score.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium">{score.name}</TableCell>
                          <TableCell>
                            <span className="text-lg font-bold">{score.score || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={gradeStyle.variant}>{score.grade || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              score.riskCategory === 'low' ? 'success' :
                              score.riskCategory === 'medium' ? 'warning' : 'destructive'
                            }>
                              {score.riskCategory === 'low' ? 'Faible' :
                               score.riskCategory === 'medium' ? 'Moyen' : 'Élevé'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${score.confidence || 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {score.confidence || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(score.createdAt), { addSuffix: true, locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!filteredScores || filteredScores.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucun score trouvé
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

export default AnalystScores;
