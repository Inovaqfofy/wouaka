import { useState } from "react";
import { 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  FileCheck,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingKyc } from "@/hooks/useAnalystStats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig = {
  pending: { label: "En attente", variant: "warning" as const, icon: Clock },
  in_progress: { label: "En cours", variant: "secondary" as const, icon: FileCheck },
  approved: { label: "Approuvé", variant: "success" as const, icon: CheckCircle },
  rejected: { label: "Rejeté", variant: "destructive" as const, icon: XCircle },
};

const AnalystKyc = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedKyc, setSelectedKyc] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: kycList, isLoading, refetch } = usePendingKyc();

  const filteredKyc = kycList?.filter(kyc => {
    const matchesSearch = kyc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          kyc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || kyc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sendNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: '/kyc',
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedKyc) return;
    const kyc = kycList?.find(k => k.id === selectedKyc);
    
    try {
      const { error } = await supabase
        .from('kyc_validations')
        .update({ 
          status: 'approved', 
          notes: reviewNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedKyc);

      if (error) throw error;
      
      // Send notification to user
      if (kyc?.userId) {
        await sendNotification(
          kyc.userId,
          'KYC Approuvé',
          `Votre dossier KYC a été approuvé.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
          'kyc_approved'
        );
      }
      
      toast({
        title: "KYC Approuvé",
        description: "La validation KYC a été approuvée et le client a été notifié.",
      });
      setIsApproveDialogOpen(false);
      setSelectedKyc(null);
      setReviewNotes("");
      refetch();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le KYC.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedKyc) return;
    const kyc = kycList?.find(k => k.id === selectedKyc);
    
    try {
      const { error } = await supabase
        .from('kyc_validations')
        .update({ 
          status: 'rejected', 
          notes: reviewNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedKyc);

      if (error) throw error;
      
      // Send notification to user
      if (kyc?.userId) {
        await sendNotification(
          kyc.userId,
          'KYC Rejeté',
          `Votre dossier KYC a été rejeté. Raison: ${reviewNotes}`,
          'kyc_rejected'
        );
      }
      
      toast({
        title: "KYC Rejeté",
        description: "La validation KYC a été rejetée et le client a été notifié.",
      });
      setIsRejectDialogOpen(false);
      setSelectedKyc(null);
      setReviewNotes("");
      refetch();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le KYC.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="analyst" title="KYC à valider">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
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
              <SelectItem value="in_progress">En cours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{kycList?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total à traiter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {kycList?.filter(k => k.status === 'pending').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {kycList?.filter(k => k.status === 'in_progress').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {kycList?.filter(k => k.riskFlags.length > 0).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Avec alertes</p>
            </CardContent>
          </Card>
        </div>

        {/* KYC Table */}
        <Card>
          <CardHeader>
            <CardTitle>Validations KYC en attente</CardTitle>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vérifications</TableHead>
                    <TableHead>Soumis</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKyc?.map((kyc) => {
                    const status = statusConfig[kyc.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={kyc.id}>
                        <TableCell className="font-mono text-sm">
                          {kyc.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">{kyc.name}</TableCell>
                        <TableCell className="text-muted-foreground">{kyc.email}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {kyc.identityVerified && (
                              <Badge variant="outline" className="text-xs">ID ✓</Badge>
                            )}
                            {kyc.addressVerified && (
                              <Badge variant="outline" className="text-xs">Adresse ✓</Badge>
                            )}
                            {kyc.documentsComplete && (
                              <Badge variant="outline" className="text-xs">Docs ✓</Badge>
                            )}
                            {kyc.riskFlags.length > 0 && (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {kyc.riskFlags.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(kyc.createdAt), { addSuffix: true, locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-success hover:text-success"
                              onClick={() => {
                                setSelectedKyc(kyc.id);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedKyc(kyc.id);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filteredKyc || filteredKyc.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucune validation KYC en attente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approuver le KYC</DialogTitle>
              <DialogDescription>
                Confirmez l'approbation de cette validation KYC.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette validation..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le KYC</DialogTitle>
              <DialogDescription>
                Indiquez la raison du rejet de cette validation KYC.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reject-notes">Raison du rejet *</Label>
              <Textarea
                id="reject-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Expliquez pourquoi cette validation est rejetée..."
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!reviewNotes.trim()}>
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AnalystKyc;
