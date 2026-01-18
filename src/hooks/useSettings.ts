import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface UserSettings {
  companyName?: string;
  contactEmail?: string;
  webhookRetries?: string;
  timezone?: string;
  notifyOnError?: boolean;
  notifyOnQuotaWarning?: boolean;
  notifyOnNewFeatures?: boolean;
  ipWhitelist?: string;
  rateLimitBurst?: string;
  enableLogging?: boolean;
}

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings> => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform array of settings to object
      const settingsMap: UserSettings = {};
      (data || []).forEach((setting) => {
        const value = setting.value as Record<string, unknown>;
        switch (setting.key) {
          case 'company_name':
            settingsMap.companyName = String(value?.value || '');
            break;
          case 'contact_email':
            settingsMap.contactEmail = String(value?.value || '');
            break;
          case 'webhook_retries':
            settingsMap.webhookRetries = String(value?.value || '3');
            break;
          case 'timezone':
            settingsMap.timezone = String(value?.value || 'Africa/Abidjan');
            break;
          case 'notify_on_error':
            settingsMap.notifyOnError = Boolean(value?.value ?? true);
            break;
          case 'notify_on_quota_warning':
            settingsMap.notifyOnQuotaWarning = Boolean(value?.value ?? true);
            break;
          case 'notify_on_new_features':
            settingsMap.notifyOnNewFeatures = Boolean(value?.value ?? false);
            break;
          case 'ip_whitelist':
            settingsMap.ipWhitelist = String(value?.value || '');
            break;
          case 'rate_limit_burst':
            settingsMap.rateLimitBurst = String(value?.value || '100');
            break;
          case 'enable_logging':
            settingsMap.enableLogging = Boolean(value?.value ?? true);
            break;
        }
      });

      return settingsMap;
    },
    enabled: !!user?.id,
  });

  // Update settings
  const updateMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      if (!user?.id) throw new Error('User not authenticated');

      const settingsToUpsert = [
        { key: 'company_name', value: { value: newSettings.companyName || '' } as Json, category: 'company' },
        { key: 'contact_email', value: { value: newSettings.contactEmail || '' } as Json, category: 'company' },
        { key: 'webhook_retries', value: { value: newSettings.webhookRetries || '3' } as Json, category: 'api' },
        { key: 'timezone', value: { value: newSettings.timezone || 'Africa/Abidjan' } as Json, category: 'general' },
        { key: 'notify_on_error', value: { value: newSettings.notifyOnError ?? true } as Json, category: 'notifications' },
        { key: 'notify_on_quota_warning', value: { value: newSettings.notifyOnQuotaWarning ?? true } as Json, category: 'notifications' },
        { key: 'notify_on_new_features', value: { value: newSettings.notifyOnNewFeatures ?? false } as Json, category: 'notifications' },
        { key: 'ip_whitelist', value: { value: newSettings.ipWhitelist || '' } as Json, category: 'security' },
        { key: 'rate_limit_burst', value: { value: newSettings.rateLimitBurst || '100' } as Json, category: 'api' },
        { key: 'enable_logging', value: { value: newSettings.enableLogging ?? true } as Json, category: 'api' },
      ];

      // Delete existing settings and insert new ones
      await supabase
        .from('settings')
        .delete()
        .eq('user_id', user.id)
        .in('key', settingsToUpsert.map(s => s.key));

      const { error } = await supabase
        .from('settings')
        .insert(
          settingsToUpsert.map(s => ({
            user_id: user.id,
            key: s.key,
            value: s.value,
            category: s.category,
            is_system: false,
          }))
        );

      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Paramètres enregistrés avec succès');
    },
    onError: (error) => {
      console.error('Settings update error:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
