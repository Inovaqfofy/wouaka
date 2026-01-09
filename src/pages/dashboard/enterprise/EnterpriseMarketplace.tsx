import { useState } from "react";
import { 
  Search, 
  Filter,
  Star,
  Building2,
  Percent,
  Clock,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";

const products = [
  { 
    id: 1,
    name: "Crédit PME Express", 
    provider: "Bank of Africa", 
    rate: "8.5%", 
    match: 92,
    minAmount: "500 000 FCFA",
    maxAmount: "50 000 000 FCFA",
    duration: "12-60 mois",
    category: "credit",
    features: ["Déblocage sous 48h", "Sans garantie jusqu'à 5M", "Taux préférentiel"],
    minScore: 70
  },
  { 
    id: 2,
    name: "Micro-Finance Agricole", 
    provider: "PAMECAS", 
    rate: "12%", 
    match: 85,
    minAmount: "100 000 FCFA",
    maxAmount: "10 000 000 FCFA",
    duration: "6-36 mois",
    category: "microfinance",
    features: ["Adapté aux cycles agricoles", "Remboursement flexible", "Accompagnement"],
    minScore: 60
  },
  { 
    id: 3,
    name: "Leasing Équipement", 
    provider: "Locafrique", 
    rate: "10%", 
    match: 78,
    minAmount: "1 000 000 FCFA",
    maxAmount: "100 000 000 FCFA",
    duration: "24-84 mois",
    category: "leasing",
    features: ["Financement à 100%", "Option d'achat", "Maintenance incluse"],
    minScore: 65
  },
  { 
    id: 4,
    name: "Crédit Commercial", 
    provider: "Ecobank", 
    rate: "9.5%", 
    match: 88,
    minAmount: "1 000 000 FCFA",
    maxAmount: "200 000 000 FCFA",
    duration: "12-72 mois",
    category: "credit",
    features: ["Ligne de crédit renouvelable", "Multidevises", "Conseil dédié"],
    minScore: 72
  },
  { 
    id: 5,
    name: "Financement Import/Export", 
    provider: "BICIS", 
    rate: "7.5%", 
    match: 72,
    minAmount: "5 000 000 FCFA",
    maxAmount: "500 000 000 FCFA",
    duration: "3-24 mois",
    category: "trade",
    features: ["Lettre de crédit", "Couverture de change", "Réseau international"],
    minScore: 75
  },
];

const categories = [
  { value: "all", label: "Toutes catégories" },
  { value: "credit", label: "Crédits" },
  { value: "microfinance", label: "Microfinance" },
  { value: "leasing", label: "Leasing" },
  { value: "trade", label: "Import/Export" },
];

const EnterpriseMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const { toast } = useToast();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.match - a.match);

  const handleApply = () => {
    setSelectedProduct(null);
    toast({
      title: "Demande envoyée",
      description: `Votre demande pour ${selectedProduct?.name} a été transmise à ${selectedProduct?.provider}. Vous serez contacté sous 24-48h.`,
    });
  };

  return (
    <DashboardLayout role="enterprise" title="Marketplace">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold">Produits financiers recommandés</h2>
            <p className="text-muted-foreground">
              Basé sur votre score de 72/100, nous avons sélectionné les meilleures offres pour vous
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit ou institution..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="card-premium hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {product.provider}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={product.match >= 85 ? "success" : product.match >= 70 ? "secondary" : "outline"}
                    className="gap-1"
                  >
                    <Star className="w-3 h-3" />
                    {product.match}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span>Taux: <strong>{product.rate}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{product.duration}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Montant: </span>
                  <span>{product.minAmount} - {product.maxAmount}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.features.slice(0, 2).map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {product.features.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.features.length - 2}
                    </Badge>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setSelectedProduct(product)}
                >
                  Voir les détails
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Product Detail Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4" />
                        {selectedProduct.provider}
                      </DialogDescription>
                    </div>
                    <Badge variant="success" className="text-lg px-3 py-1">
                      {selectedProduct.match}% match
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-xl">
                      <p className="text-sm text-muted-foreground">Taux d'intérêt</p>
                      <p className="text-2xl font-bold">{selectedProduct.rate}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl">
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="text-2xl font-bold">{selectedProduct.duration}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Montant du financement</h4>
                    <p className="text-muted-foreground">
                      De <strong>{selectedProduct.minAmount}</strong> à <strong>{selectedProduct.maxAmount}</strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Avantages</h4>
                    <ul className="space-y-2">
                      {selectedProduct.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                    <p className="text-sm">
                      <strong className="text-success">Éligibilité confirmée :</strong> Votre score de 72/100 
                      dépasse le score minimum requis de {selectedProduct.minScore} pour ce produit.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    Fermer
                  </Button>
                  <Button onClick={handleApply}>
                    Faire une demande
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseMarketplace;
