import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useScoreRequestsPaginated, useEnterpriseStats } from "@/hooks/useEnterpriseStats";
import { useCreateScoringRequest } from "@/hooks/useCreateScoringRequest";

const statusConfig = {
  completed: { label: "Terminé", variant: "success" as const, icon: CheckCircle },
  pending: { label: "En cours", variant: "warning" as const, icon: Clock },
  failed: { label: "Échoué", variant: "destructive" as const, icon: AlertCircle },
};

const PAGE_SIZE = 10;

const EnterpriseScoreRequests = () => {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const { data, isLoading } = useScoreRequestsPaginated({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
  });

  const { data: stats, isLoading: statsLoading } = useEnterpriseStats();

  // Form state for new request
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    nationalId: '',
    companyName: '',
    monthlyIncome: '',
    city: '',
    employmentType: '',
  });

  const createRequest = useCreateScoringRequest();

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createRequest.mutateAsync({
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      nationalId: formData.nationalId || undefined,
      companyName: formData.companyName || undefined,
      monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined,
      city: formData.city || undefined,
      employmentType: formData.employmentType || undefined,
    });

    setIsNewRequestOpen(false);
    setFormData({
      fullName: '',
      phoneNumber: '',
      nationalId: '',
      companyName: '',
      monthlyIncome: '',
      city: '',
      employmentType: '',
    });
  };

  return (
    <DashboardLayout role="enterprise" title="Demandes de score">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une demande..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
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

          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle demande de score</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour soumettre une nouvelle demande d'évaluation de crédit.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitRequest}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Nom complet *</Label>
                      <Input 
                        id="fullName" 
                        placeholder="Ex: Amadou Diallo" 
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">Numéro de téléphone *</Label>
                      <Input 
                        id="phoneNumber" 
                        placeholder="Ex: +221 77 123 45 67" 
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nationalId">Numéro national ID</Label>
                      <Input 
                        id="nationalId" 
                        placeholder="Ex: 1234567890"
                        value={formData.nationalId}
                        onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">Entreprise</Label>
                      <Input 
                        id="companyName" 
                        placeholder="Ex: PME Dakar Import"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="monthlyIncome">Revenu mensuel (FCFA)</Label>
                      <Input 
                        id="monthlyIncome" 
                        type="number" 
                        placeholder="Ex: 500000"
                        value={formData.monthlyIncome}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input 
                        id="city" 
                        placeholder="Ex: Dakar"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employmentType">Type d'emploi</Label>
                    <Select 
                      value={formData.employmentType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}
                    >
                      <SelectTrigger id="employmentType">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salarié</SelectItem>
                        <SelectItem value="self-employed">Travailleur indépendant</SelectItem>
                        <SelectItem value="business-owner">Chef d'entreprise</SelectItem>
                        <SelectItem value="student">Étudiant</SelectItem>
                        <SelectItem value="retired">Retraité</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createRequest.isPending}>
                    {createRequest.isPending ? 'Envoi...' : 'Soumettre la demande'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statsLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
                  <p className="text-sm text-muted-foreground">Demandes totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-success">
                    {stats?.completedRequests || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-warning">
                    {stats?.pendingRequests || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des demandes</CardTitle>
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
                      <TableHead>Objet</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.requests.map((request) => {
                      const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium font-mono text-sm">
                            {request.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{request.subject}</TableCell>
                          <TableCell>
                            {request.score ? (
                              <span className="font-semibold">{request.score}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.date}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!data?.requests || data.requests.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucune demande trouvée
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

export default EnterpriseScoreRequests;
