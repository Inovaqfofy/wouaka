import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, FileText, Loader2, Award, ArrowRight } from "lucide-react";
import type { BorrowerDocument } from "@/hooks/useBorrowerData";

interface SubmitDossierCardProps {
  documents: BorrowerDocument[];
  hasSubscription: boolean;
  isRecertifying: boolean;
  onSubmit: () => void;
  onPurchase: () => void;
}

const REQUIRED_DOC_TYPES = ['identity', 'address'];
const OPTIONAL_DOC_TYPES = ['income', 'other'];

export function SubmitDossierCard({
  documents,
  hasSubscription,
  isRecertifying,
  onSubmit,
  onPurchase,
}: SubmitDossierCardProps) {
  // Count documents by type
  const docsByType = documents.reduce((acc, doc) => {
    const type = doc.document_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasIdentity = (docsByType['identity'] || 0) > 0;
  const hasAddress = (docsByType['address'] || 0) > 0;
  const hasIncome = (docsByType['income'] || 0) > 0;
  
  const requiredComplete = hasIdentity && hasAddress;
  const totalDocs = documents.length;
  
  // Progress: identity (40%) + address (40%) + income (20%)
  const progressValue = (hasIdentity ? 40 : 0) + (hasAddress ? 40 : 0) + (hasIncome ? 20 : 0);

  // No documents yet
  if (totalDocs === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Commencez votre dossier</h3>
            <p className="text-muted-foreground text-sm">
              Ajoutez vos documents ci-dessus pour constituer votre dossier de certification.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Soumettre mon dossier
        </CardTitle>
        <CardDescription>
          {requiredComplete 
            ? "Votre dossier est prêt à être soumis pour générer votre certificat."
            : "Complétez les documents requis pour pouvoir générer votre certificat."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression du dossier</span>
            <span className="font-medium">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Document checklist */}
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasIdentity ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              {hasIdentity ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">1</span>}
            </div>
            <span className={hasIdentity ? 'text-foreground' : 'text-muted-foreground'}>
              Pièce d'identité {hasIdentity && <span className="text-success text-sm">(ajoutée)</span>}
            </span>
            {!hasIdentity && <span className="text-xs text-destructive ml-auto">Requis</span>}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasAddress ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              {hasAddress ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">2</span>}
            </div>
            <span className={hasAddress ? 'text-foreground' : 'text-muted-foreground'}>
              Justificatif de domicile {hasAddress && <span className="text-success text-sm">(ajouté)</span>}
            </span>
            {!hasAddress && <span className="text-xs text-destructive ml-auto">Requis</span>}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasIncome ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
              {hasIncome ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">3</span>}
            </div>
            <span className={hasIncome ? 'text-foreground' : 'text-muted-foreground'}>
              Justificatif de revenus {hasIncome && <span className="text-success text-sm">(ajouté)</span>}
            </span>
            {!hasIncome && <span className="text-xs text-muted-foreground ml-auto">Optionnel</span>}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          {!hasSubscription ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Vous devez avoir un abonnement actif pour générer votre certificat.
              </p>
              <Button onClick={onPurchase} className="w-full">
                Souscrire à un plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : !requiredComplete ? (
            <div className="text-center">
              <p className="text-sm text-warning mb-3">
                ⚠️ Ajoutez les documents requis (identité + domicile) pour continuer.
              </p>
              <Button disabled className="w-full">
                Générer mon Certificat
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onSubmit} 
              disabled={isRecertifying}
              className="w-full"
              size="lg"
            >
              {isRecertifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  Générer mon Certificat
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
