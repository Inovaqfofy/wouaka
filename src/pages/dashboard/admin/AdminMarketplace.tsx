import { useState } from "react";
import { 
  Search, 
  Store,
  Package,
  Eye,
  MoreHorizontal,
  DollarSign,
  CheckCircle,
  Users,
  Award,
  Building2,
  Edit,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  X
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type BorrowerPlan, type PartnerPlan } from "@/lib/pricing-plans";
import { useBorrowerPlans, usePartnerPlans, type DBBorrowerPlan, type DBPartnerPlan } from "@/hooks/useSubscriptionPlans";
import { toast } from "sonner";

type EditablePlan = Partial<DBBorrowerPlan | DBPartnerPlan> & { planType?: 'borrower' | 'partner' };

const AdminMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<DBBorrowerPlan | DBPartnerPlan | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EditablePlan | null>(null);

  // Hooks pour récupérer les plans depuis la base de données
  const { 
    plans: borrowerPlans, 
    isLoading: borrowerLoading, 
    refetch: refetchBorrower,
    updatePlan: updateBorrowerPlan,
    deletePlan: deleteBorrowerPlan,
  } = useBorrowerPlans();

  const { 
    plans: partnerPlans, 
    isLoading: partnerLoading, 
    refetch: refetchPartner,
    updatePlan: updatePartnerPlan,
    deletePlan: deletePartnerPlan,
  } = usePartnerPlans();

  // Fetch certificate subscriptions count per plan
  const { data: borrowerStats } = useQuery({
    queryKey: ["admin-certificate-subscriptions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_subscriptions")
        .select("plan_id, status, amount_paid")
        .eq("status", "active");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      let totalRevenue = 0;
      
      data?.forEach(s => {
        if (s.plan_id) {
          counts[s.plan_id] = (counts[s.plan_id] || 0) + 1;
          totalRevenue += s.amount_paid || 0;
        }
      });
      
      return { counts, totalActive: data?.length || 0, totalRevenue };
    },
  });

  // Fetch partner subscriptions count
  const { data: partnerStats } = useQuery({
    queryKey: ["admin-partner-subscriptions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_id, status")
        .eq("status", "active");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      let totalMonthlyRevenue = 0;
      
      data?.forEach(s => {
        if (s.plan_id) {
          counts[s.plan_id] = (counts[s.plan_id] || 0) + 1;
          const plan = partnerPlans.find(p => p.id === s.plan_id);
          if (plan?.price) totalMonthlyRevenue += plan.price;
        }
      });
      
      return { counts, totalActive: data?.length || 0, totalMonthlyRevenue };
    },
    enabled: partnerPlans.length > 0,
  });

  const filteredBorrowerPlans = borrowerPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartnerPlans = partnerPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (plan: DBBorrowerPlan | DBPartnerPlan) => {
    setSelectedPlan(plan);
    setIsDetailDialogOpen(true);
  };

  const handleEditPlan = (plan: DBBorrowerPlan | DBPartnerPlan, planType: 'borrower' | 'partner') => {
    setEditingPlan({ ...plan, planType });
    setIsEditDialogOpen(true);
  };

  const handleDeletePlan = (plan: DBBorrowerPlan | DBPartnerPlan, planType: 'borrower' | 'partner') => {
    setEditingPlan({ ...plan, planType });
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan?.id || !editingPlan.planType) return;

    try {
      if (editingPlan.planType === 'borrower') {
        await updateBorrowerPlan.mutateAsync({
          slug: editingPlan.id,
          planType: 'borrower',
          updates: editingPlan as Partial<BorrowerPlan>,
        });
      } else {
        await updatePartnerPlan.mutateAsync({
          slug: editingPlan.id,
          planType: 'partner',
          updates: editingPlan as Partial<PartnerPlan>,
        });
      }
      setIsEditDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingPlan?.id || !editingPlan.planType) return;

    try {
      if (editingPlan.planType === 'borrower') {
        await deleteBorrowerPlan.mutateAsync(editingPlan.id);
      } else {
        await deletePartnerPlan.mutateAsync(editingPlan.id);
      }
      setIsDeleteDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchBorrower(), refetchPartner()]);
    toast.success("Données actualisées");
  };

  const totalBorrowerRevenue = borrowerStats?.totalRevenue || 0;
  const totalPartnerRevenue = partnerStats?.totalMonthlyRevenue || 0;

  return (
    <DashboardLayout role="admin" title="Catalogue Produits">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un plan..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{borrowerPlans.length + partnerPlans.length}</div>
                  <p className="text-sm text-muted-foreground">Plans actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-secondary" />
                <div>
                  <div className="text-2xl font-bold text-secondary">{borrowerStats?.totalActive || 0}</div>
                  <p className="text-sm text-muted-foreground">Certificats actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{partnerStats?.totalActive || 0}</div>
                  <p className="text-sm text-muted-foreground">Abonnements partenaires</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">
                    {formatPrice(totalBorrowerRevenue + totalPartnerRevenue)} FCFA
                  </div>
                  <p className="text-sm text-muted-foreground">Revenus estimés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="borrower" className="space-y-6">
          <TabsList>
            <TabsTrigger value="borrower" className="gap-2">
              <Award className="w-4 h-4" />
              Plans Emprunteur (B2C)
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2">
              <Building2 className="w-4 h-4" />
              Plans Partenaire (B2B)
            </TabsTrigger>
          </TabsList>

          {/* Borrower Plans */}
          <TabsContent value="borrower" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-secondary" />
                  Plans Emprunteur - Certificats de Solvabilité
                </CardTitle>
                <CardDescription>
                  Plans dynamiques chargés depuis la base de données. Modifiables en temps réel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {borrowerLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : borrowerPlans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun plan emprunteur configuré</p>
                    <p className="text-sm">Vérifiez que les plans sont synchronisés dans la base de données.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Validité</TableHead>
                        <TableHead>Smile ID</TableHead>
                        <TableHead>Abonnés actifs</TableHead>
                        <TableHead>Revenus</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBorrowerPlans.map((plan) => {
                        const subCount = borrowerStats?.counts[plan.id] || 0;
                        const revenue = subCount * plan.price;
                        
                        return (
                          <TableRow key={plan.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  plan.popular ? "bg-secondary/20" : "bg-muted"
                                }`}>
                                  <Award className={`w-5 h-5 ${plan.popular ? "text-secondary" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{plan.name}</p>
                                    {plan.popular && (
                                      <Badge variant="secondary" className="text-xs">Populaire</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {plan.description}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{formatPrice(plan.price)} FCFA</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {plan.validityDays >= 365 ? "12 mois" : 
                                 plan.validityDays >= 90 ? "3 mois" : "30 jours"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                plan.smileIdIncluded === 'biometric' ? "default" :
                                plan.smileIdIncluded === 'basic' ? "secondary" : "outline"
                              }>
                                {plan.smileIdIncluded === 'biometric' ? "Biométrique" :
                                 plan.smileIdIncluded === 'basic' ? "Basic" : "Non inclus"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{subCount} actif(s)</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-success">
                                {formatPrice(revenue)} FCFA
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(plan)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditPlan(plan, 'borrower')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePlan(plan, 'borrower')}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Désactiver
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partner Plans */}
          <TabsContent value="partner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Plans Partenaire - API Dossiers de Preuves
                </CardTitle>
                <CardDescription>
                  Abonnements mensuels avec quotas de dossiers. Modifiables en temps réel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnerLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : partnerPlans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun plan partenaire configuré</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Prix mensuel</TableHead>
                        <TableHead>Dossiers/mois</TableHead>
                        <TableHead>Abonnés actifs</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartnerPlans.map((plan) => {
                        const subCount = partnerStats?.counts[plan.id] || 0;
                        const mrr = subCount * (plan.price || 0);
                        
                        return (
                          <TableRow key={plan.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  plan.popular ? "bg-primary/20" : "bg-muted"
                                }`}>
                                  <Building2 className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{plan.name}</p>
                                    {plan.popular && (
                                      <Badge className="text-xs">Recommandé</Badge>
                                    )}
                                    {plan.isCustom && (
                                      <Badge variant="outline" className="text-xs">Sur mesure</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {plan.description}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {plan.price ? `${formatPrice(plan.price)} FCFA` : "Sur mesure"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {plan.quotas?.dossiers ? plan.quotas.dossiers : "Illimité"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{subCount} actif(s)</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-success">
                                {formatPrice(mrr)} FCFA
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(plan)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditPlan(plan, 'partner')}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePlan(plan, 'partner')}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Désactiver
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Plan Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails du plan</DialogTitle>
              <DialogDescription>
                {selectedPlan?.name} - {selectedPlan?.description}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prix</p>
                    <p className="font-semibold">
                      {'price' in selectedPlan 
                        ? `${formatPrice(selectedPlan.price || 0)} FCFA`
                        : "Sur mesure"}
                    </p>
                  </div>
                  {'validityDays' in selectedPlan && (
                    <div>
                      <p className="text-sm text-muted-foreground">Validité</p>
                      <p className="font-semibold">
                        {selectedPlan.validityDays >= 365 ? "12 mois" : 
                         selectedPlan.validityDays >= 90 ? "3 mois" : "30 jours"}
                      </p>
                    </div>
                  )}
                  {'quotas' in selectedPlan && selectedPlan.quotas && 'dossiers' in selectedPlan.quotas && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dossiers/mois</p>
                      <p className="font-semibold">
                        {selectedPlan.quotas.dossiers || "Illimité"}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Fonctionnalités incluses</p>
                  <div className="space-y-2">
                    {selectedPlan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier le plan</DialogTitle>
              <DialogDescription>
                Modifiez les paramètres du plan. Les changements seront appliqués immédiatement.
              </DialogDescription>
            </DialogHeader>
            {editingPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom du plan</Label>
                    <Input
                      id="edit-name"
                      value={editingPlan.name || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Prix (FCFA)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingPlan.price || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  />
                </div>
                {editingPlan.planType === 'borrower' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-validity">Validité (jours)</Label>
                        <Input
                          id="edit-validity"
                          type="number"
                          value={(editingPlan as Partial<DBBorrowerPlan>).validityDays || 30}
                          onChange={(e) => setEditingPlan({ 
                            ...editingPlan, 
                            validityDays: parseInt(e.target.value) || 30 
                          } as EditablePlan)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-smile">Niveau Smile ID</Label>
                        <Select 
                          value={(editingPlan as Partial<DBBorrowerPlan>).smileIdIncluded || 'none'}
                          onValueChange={(value: 'none' | 'basic' | 'biometric') => 
                            setEditingPlan({ ...editingPlan, smileIdIncluded: value } as EditablePlan)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Non inclus</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="biometric">Biométrique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-shares">Partages gratuits</Label>
                        <Input
                          id="edit-shares"
                          type="number"
                          value={(editingPlan as Partial<DBBorrowerPlan>).maxFreeShares ?? 1}
                          onChange={(e) => setEditingPlan({ 
                            ...editingPlan, 
                            maxFreeShares: e.target.value ? parseInt(e.target.value) : null 
                          } as EditablePlan)}
                          placeholder="Vide = illimité"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-share-price">Prix partage supplémentaire</Label>
                        <Input
                          id="edit-share-price"
                          type="number"
                          value={(editingPlan as Partial<DBBorrowerPlan>).sharePrice || 0}
                          onChange={(e) => setEditingPlan({ 
                            ...editingPlan, 
                            sharePrice: parseInt(e.target.value) || 0 
                          } as EditablePlan)}
                        />
                      </div>
                    </div>
                  </>
                )}
                {editingPlan.planType === 'partner' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-dossiers">Dossiers/mois</Label>
                      <Input
                        id="edit-dossiers"
                        type="number"
                        value={(editingPlan as Partial<DBPartnerPlan>).quotas?.dossiers ?? ''}
                        onChange={(e) => setEditingPlan({ 
                          ...editingPlan, 
                          quotas: { dossiers: e.target.value ? parseInt(e.target.value) : null }
                        } as EditablePlan)}
                        placeholder="Vide = illimité"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="edit-custom"
                        checked={(editingPlan as Partial<DBPartnerPlan>).isCustom || false}
                        onCheckedChange={(checked) => 
                          setEditingPlan({ ...editingPlan, isCustom: checked } as EditablePlan)
                        }
                      />
                      <Label htmlFor="edit-custom">Plan sur mesure</Label>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-popular"
                    checked={editingPlan.popular || false}
                    onCheckedChange={(checked) => 
                      setEditingPlan({ ...editingPlan, popular: checked })
                    }
                  />
                  <Label htmlFor="edit-popular">Plan populaire/recommandé</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateBorrowerPlan.isPending || updatePartnerPlan.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Désactiver ce plan ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le plan "{editingPlan?.name}" sera désactivé et ne sera plus visible pour les nouveaux clients.
                Les abonnements existants ne seront pas affectés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Désactiver
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Plans dynamiques</h4>
                <p className="text-sm text-muted-foreground">
                  Les plans sont maintenant stockés dans la base de données et modifiables en temps réel via cette interface.
                  Les modifications sont instantanément appliquées à tous les nouveaux clients.
                  Les statistiques sont récupérées depuis les tables <code className="bg-muted px-1 rounded">certificate_subscriptions</code> (B2C) et <code className="bg-muted px-1 rounded">subscriptions</code> (B2B).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminMarketplace;
