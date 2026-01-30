import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCinetPay } from "@/hooks/useCinetPay";
import { useNavigate } from "react-router-dom";
import { PricingPlan, PartnerPlan } from "@/lib/pricing-plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionButtonProps {
  plan: (PricingPlan | PartnerPlan) & { isTrial?: boolean };
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export const SubscriptionButton = ({ 
  plan, 
  variant = "default",
  className = ""
}: SubscriptionButtonProps) => {
  const { user } = useAuth();
  const { openPaymentPage, isLoading: isCinetPayLoading } = useCinetPay();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    // Enterprise plan - redirect to contact
    if (plan.isCustom) {
      navigate("/contact");
      return;
    }

    // Not logged in - redirect to auth with return URL
    if (!user) {
      if (plan.isTrial) {
        navigate(`/auth?mode=signup&role=PARTENAIRE&trial=true`);
      } else {
        navigate(`/auth?redirect=/pricing&plan=${plan.id}`);
      }
      return;
    }

    // Trial plan - activate directly without payment
    if (plan.isTrial) {
      setIsProcessing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Non authentifié");
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscriptions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ is_trial: true }),
          }
        );

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Erreur lors de l'activation");
        }

        toast.success("Essai gratuit activé ! Bienvenue chez WOUAKA.");
        navigate("/dashboard/partner");
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Paid plan - initiate CinetPay payment
    if (plan.price) {
      setIsProcessing(true);
      try {
        await openPaymentPage({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const isLoading = isProcessing || isCinetPayLoading;

  return (
    <Button
      className={className}
      variant={variant}
      size="lg"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Traitement...
        </>
      ) : plan.isTrial ? (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          {plan.cta}
        </>
      ) : (
        <>
          {plan.cta}
          <ArrowRight className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  );
};
