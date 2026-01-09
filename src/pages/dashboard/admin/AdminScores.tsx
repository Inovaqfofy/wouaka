import { useState } from "react";
import { 
  Search, 
  Filter,
  Download,
  Eye
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
import { useAllScores } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

const gradeColors: Record<string, string> = {
  "A+": "text-success",
  "A": "text-success",
  "B+": "text-primary",
  "B": "text-primary",
  "C+": "text-warning",
  "C": "text-warning",
  "D": "text-destructive",
  "F": "text-destructive",
};

const AdminScores = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: scores, isLoading } = useAllScores();

  const filteredScores = scores?.filter(s => {
    const matchesSearch = 
      (s.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.company_name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const avgScore = scores?.length 
    ? Math.round(scores.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / scores.filter(s => s.score).length)
    : 0;

  return (
    <DashboardLayout role="admin" title="Tous les scores">
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
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="pending">En cours</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
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
              <div className="text-2xl font-bold">{scores?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total scores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{avgScore}</div>
              <p className="text-sm text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {scores?.filter(s => s.status === "completed").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Terminés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {scores?.filter(s => s.status === "pending").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
        </div>

        {/* Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des scores</CardTitle>
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
                    <TableHead>Entité</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-mono text-sm">
                        {score.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{score.company_name || score.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{score.sector || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {score.score ? (
                          <span className="font-bold text-lg">{score.score}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {score.grade ? (
                          <span className={`font-bold ${gradeColors[score.grade] || ""}`}>
                            {score.grade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {score.risk_category ? (
                          <Badge variant="outline">{score.risk_category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            score.status === "completed" ? "success" :
                            score.status === "pending" ? "warning" : "destructive"
                          }
                        >
                          {score.status === "completed" ? "Terminé" :
                           score.status === "pending" ? "En cours" : "Échoué"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(score.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredScores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun score trouvé
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

export default AdminScores;
