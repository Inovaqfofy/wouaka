import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, XCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrialSubscription } from "@/hooks/useTrialSubscription";

export const TrialBanner = () => {
  const { isTrialing, trialDaysLeft, isExpired, isLoading } = useTrialSubscription();

  // Ne rien afficher si pas en trial ou en chargement
  if (isLoading || (!isTrialing && !isExpired)) {
    return null;
  }

  // Trial expiré
  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Essai expiré</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Votre période d'essai gratuit est terminée. Choisissez un plan pour continuer à utiliser l'API.
          </span>
          <Button asChild size="sm" className="ml-4">
            <Link to="/dashboard/partner/billing">
              <Zap className="w-4 h-4 mr-2" />
              Choisir un plan
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial en cours - moins de 3 jours restants
  if (trialDaysLeft <= 3) {
    return (
      <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">
          Essai bientôt terminé !
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between text-amber-600 dark:text-amber-300">
          <span>
            Plus que <strong>{trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''}</strong> d'essai gratuit.
            Passez à un plan payant pour ne pas interrompre votre service.
          </span>
          <Button asChild size="sm" variant="default" className="ml-4 bg-amber-600 hover:bg-amber-700">
            <Link to="/dashboard/partner/billing">
              Passer au plan payant
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial en cours - normal
  return (
    <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700 dark:text-blue-400">
        Période d'essai
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between text-blue-600 dark:text-blue-300">
        <span>
          Il vous reste <strong>{trialDaysLeft} jours</strong> d'essai gratuit (10 dossiers inclus).
          Profitez-en pour tester l'API !
        </span>
        <Button asChild size="sm" variant="outline" className="ml-4 border-blue-500 text-blue-600 hover:bg-blue-100">
          <Link to="/dashboard/partner/billing">
            Voir les plans
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};
