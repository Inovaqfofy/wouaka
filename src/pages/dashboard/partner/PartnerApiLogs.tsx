import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Search, 
  Download,
  Filter
} from "lucide-react";
import { useApiCalls } from "@/hooks/useApiCalls";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PartnerApiLogs = () => {
  const { apiCalls, isLoading } = useApiCalls();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const filteredCalls = apiCalls?.filter(call => {
    const matchesSearch = call.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "success" && call.status_code >= 200 && call.status_code < 300) ||
      (statusFilter === "error" && call.status_code >= 400);
    const matchesMethod = methodFilter === "all" || call.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  }) || [];

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-100 text-green-800">{statusCode}</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800">{statusCode}</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">{statusCode}</Badge>;
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[method] || 'bg-gray-100 text-gray-800'}>{method}</Badge>;
  };

  const successCalls = apiCalls?.filter(c => c.status_code >= 200 && c.status_code < 300).length || 0;
  const errorCalls = apiCalls?.filter(c => c.status_code >= 400).length || 0;

  return (
    <DashboardLayout role="partner" title="Logs API">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{apiCalls?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{successCalls}</p>
                  <p className="text-sm text-muted-foreground">Succès</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{errorCalls}</p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {apiCalls && apiCalls.length > 0 
                      ? Math.round(apiCalls.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / apiCalls.length)
                      : 0}ms
                  </p>
                  <p className="text-sm text-muted-foreground">Latence moy.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historique des Appels</CardTitle>
              <CardDescription>Consultez l'historique de vos appels API</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="error">Erreurs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun log trouvé</h3>
                <p className="text-muted-foreground">
                  Aucun appel API ne correspond à vos critères
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Latence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.slice(0, 50).map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(call.created_at), 'dd MMM HH:mm:ss', { locale: fr })}
                        </TableCell>
                        <TableCell>{getMethodBadge(call.method)}</TableCell>
                        <TableCell className="font-mono text-sm">{call.endpoint}</TableCell>
                        <TableCell>{getStatusBadge(call.status_code)}</TableCell>
                        <TableCell className="text-sm">{call.processing_time_ms || '--'}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerApiLogs;
