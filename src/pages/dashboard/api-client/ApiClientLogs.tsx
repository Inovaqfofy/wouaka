import { useState } from "react";
import { 
  FileText, 
  Search,
  Filter,
  Download,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/tables/DataTable";
import { useApiCalls } from "@/hooks/useApiCalls";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

const ApiClientLogs = () => {
  const { apiCalls, stats, isLoading } = useApiCalls();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const filteredCalls = apiCalls.filter(call => {
    const matchesSearch = call.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" 
      ? true 
      : statusFilter === "success" 
        ? (call.status_code >= 200 && call.status_code < 300)
        : (call.status_code >= 400);
    const matchesMethod = methodFilter === "all" || call.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const successCalls = apiCalls.filter(c => c.status_code >= 200 && c.status_code < 300);
  const errorCalls = apiCalls.filter(c => c.status_code >= 400);

  const statusBadge = (status: number) => {
    if (status >= 200 && status < 300) return <Badge variant="success">{status}</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="warning">{status}</Badge>;
    return <Badge variant="destructive">{status}</Badge>;
  };

  return (
    <DashboardLayout role="api-client" title="Logs API">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{apiCalls.length}</p>
              <p className="text-sm text-muted-foreground">Total appels</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{successCalls.length}</p>
              <p className="text-sm text-muted-foreground">Succès</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{errorCalls.length}</p>
              <p className="text-sm text-muted-foreground">Erreurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(stats.avgLatency)}ms</p>
              <p className="text-sm text-muted-foreground">Latence moy.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historique des appels API
            </CardTitle>
            <CardDescription>
              Consultez tous vos appels API en détail
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="font-medium text-lg mb-2">Aucun log trouvé</h3>
              <p className="text-sm">
                {searchQuery || statusFilter !== "all" || methodFilter !== "all"
                  ? "Modifiez vos filtres pour voir plus de résultats"
                  : "Vos appels API apparaîtront ici"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Méthode</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Endpoint</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Latence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm">{format(new Date(call.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(call.created_at), { locale: fr, addSuffix: true })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={call.method === "POST" ? "default" : call.method === "DELETE" ? "destructive" : "outline"}>
                          {call.method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm truncate max-w-[200px] block">{call.endpoint}</code>
                      </td>
                      <td className="py-3 px-4">
                        {statusBadge(call.status_code)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {call.processing_time_ms ? `${call.processing_time_ms}ms` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ApiClientLogs;
