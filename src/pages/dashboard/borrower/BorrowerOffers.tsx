import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, 
  Search, 
  Filter,
  ArrowRight,
  Building2,
  Percent,
  Calendar,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BorrowerOffers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Placeholder data - will be connected to actual data later
  const products: Array<{ id: string; name: string; provider_name: string; description: string | null; category: string; is_featured: boolean; interest_rate: number | null; duration_max_months: number | null; min_amount: number | null; max_amount: number | null; min_score_required: number | null }> = [];
  const isLoading = false;

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.provider_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '--';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <DashboardLayout role="borrower" title="Offres Disponibles">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6">
          <h2 className="text-xl font-display font-bold text-foreground">
            Trouvez le financement adapté à vos besoins
          </h2>
          <p className="text-muted-foreground mt-1">
            Explorez les offres de nos partenaires financiers et postulez en ligne
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une offre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="personal">Prêt personnel</SelectItem>
                  <SelectItem value="business">Prêt entreprise</SelectItem>
                  <SelectItem value="microfinance">Microfinance</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
                <p className="text-muted-foreground">
                  Aucune offre ne correspond à vos critères de recherche
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {product.provider_name}
                      </CardDescription>
                    </div>
                    {product.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">Populaire</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "Découvrez cette offre de financement adaptée à vos besoins."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{product.interest_rate || '--'}%</p>
                        <p className="text-xs text-muted-foreground">Taux d'intérêt</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{product.duration_max_months || '--'} mois</p>
                        <p className="text-xs text-muted-foreground">Durée max</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Montant:</span>
                      <span className="font-semibold">
                        {formatCurrency(product.min_amount)} - {formatCurrency(product.max_amount)}
                      </span>
                    </div>
                    
                    {product.min_score_required && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Score minimum requis: {product.min_score_required}
                      </div>
                    )}

                    <Button className="w-full" asChild>
                      <Link to={`/apply/${product.id}`}>
                        Postuler
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BorrowerOffers;
