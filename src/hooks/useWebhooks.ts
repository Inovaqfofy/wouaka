import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean | null;
  last_triggered_at: string | null;
  failure_count: number | null;
  created_at: string;
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWebhooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les webhooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createWebhook = async (name: string, url: string, events: string[]) => {
    try {
      // Generate a secret for the webhook
      const array = new Uint8Array(24);
      crypto.getRandomValues(array);
      const secret = 'whsec_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: user.id,
          name,
          url,
          events,
          secret,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Webhook créé",
        description: `Secret: ${secret.substring(0, 20)}...`,
      });
      
      await fetchWebhooks();
      return { ...data, secret };
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le webhook",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      
      toast({ title: "Webhook supprimé" });
      await fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le webhook",
        variant: "destructive",
      });
    }
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: isActive })
        .eq('id', webhookId);

      if (error) throw error;
      
      toast({ title: isActive ? "Webhook activé" : "Webhook désactivé" });
      await fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le webhook",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    isLoading,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
  };
}
