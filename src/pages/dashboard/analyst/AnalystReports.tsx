import { useState } from "react";
import { 
  FileText, 
  Download,
  Plus,
  Calendar,
  Filter,
  Eye,
  Trash2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Mock data for reports - in production, this would come from Supabase
const mockReports = [
  { 
    id: "RPT-001", 
    title: "Rapport mensuel KYC - Décembre 2024", 
    type: "kyc", 
    status: "completed",
    createdAt: "2024-12-31",
    size: "2.4 MB"
  },
  { 
    id: "RPT-002", 
    title: "Analyse de risque - Portfolio Q4", 
    type: "risk", 
    status: "completed",
    createdAt: "2024-12-28",
    size: "1.8 MB"
  },
  { 
    id: "RPT-003", 
    title: "Rapport de performance scoring", 
    type: "scoring", 
    status: "generating",
    createdAt: "2025-01-02",
    size: "—"
  },
  { 
    id: "RPT-004", 
    title: "Audit sécurité - Décembre", 
    type: "audit", 
    status: "completed",
    createdAt: "2024-12-30",
    size: "3.1 MB"
  },
];

const typeLabels = {
  kyc: { label: "KYC", variant: "default" as const },
  risk: { label: "Risque", variant: "warning" as const },
  scoring: { label: "Scoring", variant: "secondary" as const },
  audit: { label: "Audit", variant: "outline" as const },
};

const statusConfig = {
  completed: { label: "Terminé", variant: "success" as const },
  generating: { label: "En cours", variant: "warning" as const },
  failed: { label: "Échoué", variant: "destructive" as const },
};

const AnalystReports = () => {
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const filteredReports = mockReports.filter(report => 
    typeFilter === "all" || report.type === typeFilter
  );

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsNewReportOpen(false);
    toast({
      title: "Rapport en cours de génération",
      description: "Vous serez notifié lorsque le rapport sera prêt.",
    });
  };

  return (
    <DashboardLayout role="analyst" title="Rapports">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Rapport KYC</p>
                <p className="text-xs text-muted-foreground">Générer mensuel</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Analyse Risque</p>
                <p className="text-xs text-muted-foreground">Portfolio actuel</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 bg-secondary/50 rounded-lg">
                <FileText className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium">Performance</p>
                <p className="text-xs text-muted-foreground">Scores analysés</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Audit</p>
                <p className="text-xs text-muted-foreground">Sécurité système</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type de rapport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="kyc">KYC</SelectItem>
              <SelectItem value="risk">Risque</SelectItem>
              <SelectItem value="scoring">Scoring</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Générer un rapport</DialogTitle>
                <DialogDescription>
                  Configurez les paramètres du rapport à générer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateReport}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Titre du rapport</Label>
                    <Input id="title" placeholder="Ex: Rapport mensuel KYC - Janvier 2025" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type de rapport</Label>
                    <Select required>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kyc">Rapport KYC</SelectItem>
                        <SelectItem value="risk">Analyse de risque</SelectItem>
                        <SelectItem value="scoring">Performance scoring</SelectItem>
                        <SelectItem value="audit">Audit sécurité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date">Date début</Label>
                      <Input id="start-date" type="date" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date">Date fin</Label>
                      <Input id="end-date" type="date" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Informations supplémentaires..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewReportOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Générer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des rapports</CardTitle>
            <CardDescription>
              Consultez et téléchargez vos rapports générés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const typeStyle = typeLabels[report.type as keyof typeof typeLabels];
                  const statusStyle = statusConfig[report.status as keyof typeof statusConfig];
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">{report.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {report.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeStyle.variant}>{typeStyle.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{report.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            disabled={report.status !== 'completed'}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalystReports;
