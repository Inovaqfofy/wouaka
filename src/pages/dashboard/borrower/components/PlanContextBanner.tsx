import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Upload, ShieldCheck, ArrowUpRight } from "lucide-react";

interface PlanContextBannerProps {
  hasSubscription: boolean;
  isDiscoveryPlan: boolean;
  hasSmileIdVerification: boolean;
  onPurchase: () => void;
}

export function PlanContextBanner({
  hasSubscription,
  isDiscoveryPlan,
  hasSmileIdVerification,
  onPurchase,
}: PlanContextBannerProps) {
  if (!hasSubscription) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Obtenez votre Certificat de Solvabilité</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Souscrivez à un plan pour obtenir un certificat de solvabilité reconnu par les institutions financières.
                Les documents uploadés renforceront votre dossier de certification.
              </p>
              <Button onClick={onPurchase}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Choisir un plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isDiscoveryPlan) {
    return (
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Plan Découverte - Documents Manuels</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Votre plan actuel ne comprend pas la vérification biométrique automatique.
                Uploadez vos documents manuellement pour renforcer votre dossier, ou passez à un plan supérieur.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onPurchase}>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Passer au plan supérieur
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasSmileIdVerification) {
    return (
      <Card className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Vérification Biométrique Active</h3>
              <p className="text-sm text-muted-foreground">
                Votre identité a été vérifiée via Smile ID. Vous pouvez ajouter des documents supplémentaires 
                pour enrichir votre dossier (justificatifs de revenus, domicile, etc.).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
