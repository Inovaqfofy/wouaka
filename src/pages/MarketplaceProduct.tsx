import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Building2,
  Percent,
  Clock,
  CheckCircle,
  Star,
  Shield,
  FileText,
  Users,
  ArrowRight,
  Loader2
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicProduct, formatAmount, formatDuration } from "@/hooks/usePublicMarketplace";
import { SEOHead } from "@/components/seo/SEOHead";

const MarketplaceProduct = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = usePublicProduct(productId);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 mb-6" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !product) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-2xl font-bold mb-4">Offre introuvable</h1>
            <p className="text-muted-foreground mb-8">
              Cette offre n'existe pas ou n'est plus disponible.
            </p>
            <Button asChild>
              <Link to="/marketplace">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au marketplace
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead 
        title={`${product.name} | Marketplace Wouaka`}
        description={product.description || `Offre de ${product.provider_name} - ${formatAmount(product.min_amount)} à ${formatAmount(product.max_amount)}`}
      />

      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Product Header */}
        <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {product.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Offre vedette
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Score minimum: {product.min_score_required}/100
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Building2 className="w-5 h-5" />
                  <span>{product.provider_name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Taux d'intérêt</div>
                <div className="text-4xl font-bold text-primary">
                  {product.interest_rate ? `${product.interest_rate}%` : 'Variable'}
                </div>
                <div className="text-sm text-muted-foreground">par an</div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Percent className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-1">Taux d'intérêt</div>
                  <div className="text-2xl font-bold">
                    {product.interest_rate ? `${product.interest_rate}%` : 'Variable'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-1">Durée</div>
                  <div className="text-2xl font-bold">
                    {formatDuration(product.duration_min_months, product.duration_max_months)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground mb-1">Score requis</div>
                  <div className="text-2xl font-bold">{product.min_score_required}/100</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Description */}
                {product.description && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Montant du financement</h2>
                  <div className="bg-muted rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Minimum</div>
                        <div className="text-xl font-bold">{formatAmount(product.min_amount)}</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Maximum</div>
                        <div className="text-xl font-bold">{formatAmount(product.max_amount)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Avantages</h2>
                    <ul className="space-y-3">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column - CTA */}
              <div>
                <Card className="sticky top-24 border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl">Candidater pour cette offre</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-sm">
                        <Shield className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <strong>Vérification KYC</strong>
                          <p className="text-muted-foreground">Vérifiez votre identité de manière sécurisée</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <strong>Score de crédit</strong>
                          <p className="text-muted-foreground">Obtenez votre score basé sur des données alternatives</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <strong>Éligibilité instantanée</strong>
                          <p className="text-muted-foreground">Découvrez immédiatement si vous êtes éligible</p>
                        </div>
                      </div>
                    </div>

                    {product.requirements && product.requirements.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-3">Documents requis</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          {product.requirements.map((req, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => navigate(`/apply/${product.id}`)}
                    >
                      Commencer ma candidature
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      En candidatant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default MarketplaceProduct;
