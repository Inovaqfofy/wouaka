import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { 
  Store, 
  Search, 
  Plus,
  Trash2,
  Eye,
  Users
} from "lucide-react";
import { usePartnerOffers } from "@/hooks/usePartnerOffers";
import { AddOfferDialog } from "@/components/partner/AddOfferDialog";
import { EditOfferDialog } from "@/components/partner/EditOfferDialog";

const PartnerOffers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { offers, isLoading, updateOffer, deleteOffer } = usePartnerOffers();

  const filteredOffers = offers?.filter(offer => 
    offer.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '--';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <DashboardLayout role="partner" title="Mes Offres">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total offres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {offers?.filter(o => o.is_active).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {offers?.reduce((sum, o) => sum + (o.applications_count || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Candidatures</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {offers?.reduce((sum, o) => sum + (o.views_count || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Vues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offers List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes Offres de Financement</CardTitle>
              <CardDescription>Gérez vos offres publiées sur le marketplace</CardDescription>
            </div>
            <AddOfferDialog />
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une offre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune offre</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première offre pour la publier sur le marketplace
                </p>
                <AddOfferDialog trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une offre
                  </Button>
                } />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <div 
                    key={offer.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{offer.name}</h3>
                          <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                            {offer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {offer.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">En vedette</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {offer.description || "Aucune description"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span>
                            <strong>Montant:</strong> {formatCurrency(offer.min_amount)} - {formatCurrency(offer.max_amount)}
                          </span>
                          <span>
                            <strong>Taux:</strong> {offer.interest_rate || '--'}%
                          </span>
                          <span>
                            <strong>Durée:</strong> {offer.duration_min_months || '--'} - {offer.duration_max_months || '--'} mois
                          </span>
                          <span>
                            <strong>Score min:</strong> {offer.min_score_required || '--'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-4">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch
                            checked={offer.is_active || false}
                            onCheckedChange={(checked) => updateOffer.mutate({ id: offer.id, is_active: checked })}
                          />
                        </div>
                        <EditOfferDialog offer={offer} />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteOffer.mutate(offer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                      <span>{offer.views_count || 0} vues</span>
                      <span>{offer.applications_count || 0} candidatures</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerOffers;
