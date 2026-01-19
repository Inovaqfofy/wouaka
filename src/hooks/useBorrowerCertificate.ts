// Hook mis à jour pour le VPS WOUAKA
export function useCertificatePayment() {
  const { user } = useAuth();

  const initPayment = useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.id) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        throw new Error('Non authentifié');
      }

      console.log('🚀 Initialisation du paiement pour le plan:', planId);

      // On appelle la fonction configurée sur le VPS
      // Note: On utilise 'cinetpay-init' car c'est celle qui contient votre logique CinetPay
      const { data, error } = await supabase.functions.invoke('cinetpay-init', {
        body: { 
          plan_id: planId,
          user_id: user.id 
        }
      });

      // Gestion des erreurs de l'Edge Function
      if (error) {
        console.error('❌ Erreur Supabase Function:', error);
        throw new Error(`Erreur serveur: ${error.message}`);
      }

      // Vérification du format de réponse de votre VPS
      // On accepte 'url' ou 'payment_url' pour être flexible
      const paymentUrl = data?.url || data?.payment_url;

      if (!paymentUrl) {
        console.error('❌ Réponse du serveur incomplète:', data);
        throw new Error(data?.error || 'Le serveur n\'a pas renvoyé d\'URL de paiement');
      }

      return data;
    },
    onSuccess: (data) => {
      const url = data?.url || data?.payment_url;
      toast.success('Redirection vers la plateforme de paiement...');
      
      // Petit délai pour laisser le temps au toast de s'afficher
      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    },
    onError: (error: any) => {
      console.error('❌ Erreur détaillée paiement:', error);
      toast.error(error.message || "Impossible d'initialiser le paiement. Vérifiez votre connexion.");
    }
  });

  const openPaymentPage = async (planId: string) => {
    try {
      await initPayment.mutateAsync(planId);
    } catch (error) {
      // L'erreur est déjà gérée par le onError de useMutation
    }
  };

  return {
    initPayment: initPayment.mutate,
    initPaymentAsync: initPayment.mutateAsync,
    openPaymentPage,
    isLoading: initPayment.isPending
  };
}
