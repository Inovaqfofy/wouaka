import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[] | null;
  rate_limit: number | null;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  key?: string; // Only returned on creation/rotation
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('partners-api-keys', {
        method: 'GET',
      });

      if (error) throw error;
      if (data?.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clés API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createApiKey = async (name: string, permissions?: string[], expiresInDays?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('partners-api-keys', {
        method: 'POST',
        body: { name, permissions, expires_in_days: expiresInDays },
      });

      if (error) throw error;
      if (data?.success) {
        toast({
          title: "Clé API créée",
          description: "Copiez la clé maintenant, elle ne sera plus affichée",
        });
        await fetchApiKeys();
        return data.data;
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la clé API",
        variant: "destructive",
      });
    }
    return null;
  };

  const rotateApiKey = async (keyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(`partners-api-keys/${keyId}`, {
        method: 'PUT',
        body: { rotate: true },
      });

      if (error) throw error;
      if (data?.success) {
        toast({
          title: "Clé régénérée",
          description: "Copiez la nouvelle clé maintenant",
        });
        await fetchApiKeys();
        return data.data;
      }
    } catch (error) {
      console.error('Error rotating API key:', error);
      toast({
        title: "Erreur",
        description: "Impossible de régénérer la clé",
        variant: "destructive",
      });
    }
    return null;
  };

  const toggleApiKey = async (keyId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke(`partners-api-keys/${keyId}`, {
        method: 'PUT',
        body: { is_active: isActive },
      });

      if (error) throw error;
      if (data?.success) {
        toast({
          title: isActive ? "Clé activée" : "Clé désactivée",
        });
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la clé",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(`partners-api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (error) throw error;
      toast({
        title: "Clé supprimée",
      });
      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la clé",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    isLoading,
    fetchApiKeys,
    createApiKey,
    rotateApiKey,
    toggleApiKey,
    deleteApiKey,
  };
}
