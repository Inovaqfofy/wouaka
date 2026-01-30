import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface UserSettings {
  // Company
  company_name?: string;
  company_email?: string;
  phone?: string;
  country?: string;
  // Notifications
  email_notifications?: boolean;
  webhook_notifications?: boolean;
  sms_notifications?: boolean;
  // API
  api_rate_limit?: string;
  timezone?: string;
  webhook_retries?: string;
  enable_logging?: boolean;
  // Security
  ip_whitelist?: string;
  // Legacy mappings (for backward compatibility)
  companyName?: string;
  contactEmail?: string;
  notifyOnError?: boolean;
  notifyOnQuotaWarning?: boolean;
  notifyOnNewFeatures?: boolean;
  rateLimitBurst?: string;
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
        const actualValue = value?.value;
        
        // Map setting keys to interface properties
        switch (setting.key) {
          // Company settings
          case 'company_name':
            settingsMap.company_name = String(actualValue || '');
            settingsMap.companyName = String(actualValue || ''); // Legacy
            break;
          case 'company_email':
          case 'contact_email':
            settingsMap.company_email = String(actualValue || '');
            settingsMap.contactEmail = String(actualValue || ''); // Legacy
            break;
          case 'phone':
            settingsMap.phone = String(actualValue || '');
            break;
          case 'country':
            settingsMap.country = String(actualValue || 'CI');
            break;
          // Notifications
          case 'email_notifications':
            settingsMap.email_notifications = Boolean(actualValue ?? true);
            break;
          case 'webhook_notifications':
            settingsMap.webhook_notifications = Boolean(actualValue ?? true);
            break;
          case 'sms_notifications':
            settingsMap.sms_notifications = Boolean(actualValue ?? false);
            break;
          case 'notify_on_error':
            settingsMap.notifyOnError = Boolean(actualValue ?? true);
            break;
          case 'notify_on_quota_warning':
            settingsMap.notifyOnQuotaWarning = Boolean(actualValue ?? true);
            break;
          case 'notify_on_new_features':
            settingsMap.notifyOnNewFeatures = Boolean(actualValue ?? false);
            break;
          // API
          case 'api_rate_limit':
            settingsMap.api_rate_limit = String(actualValue || '1000');
            break;
          case 'rate_limit_burst':
            settingsMap.rateLimitBurst = String(actualValue || '100');
            break;
          case 'timezone':
            settingsMap.timezone = String(actualValue || 'Africa/Abidjan');
            break;
          case 'webhook_retries':
            settingsMap.webhook_retries = String(actualValue || '3');
            break;
          case 'enable_logging':
            settingsMap.enable_logging = Boolean(actualValue ?? true);
            break;
          // Security
          case 'ip_whitelist':
            settingsMap.ip_whitelist = String(actualValue || '');
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

      // Build the settings to upsert based on what's in newSettings
      const settingsToUpsert: Array<{
        user_id: string;
        key: string;
        value: Json;
        category: string;
        is_system: boolean;
      }> = [];

      // Map of setting keys to their category
      const settingConfig: Record<string, { category: string; getValue: () => Json }> = {
        company_name: { category: 'company', getValue: () => ({ value: newSettings.company_name || newSettings.companyName || '' }) },
        company_email: { category: 'company', getValue: () => ({ value: newSettings.company_email || newSettings.contactEmail || '' }) },
        phone: { category: 'company', getValue: () => ({ value: newSettings.phone || '' }) },
        country: { category: 'company', getValue: () => ({ value: newSettings.country || 'CI' }) },
        email_notifications: { category: 'notifications', getValue: () => ({ value: newSettings.email_notifications ?? true }) },
        webhook_notifications: { category: 'notifications', getValue: () => ({ value: newSettings.webhook_notifications ?? true }) },
        sms_notifications: { category: 'notifications', getValue: () => ({ value: newSettings.sms_notifications ?? false }) },
        api_rate_limit: { category: 'api', getValue: () => ({ value: newSettings.api_rate_limit || '1000' }) },
        timezone: { category: 'general', getValue: () => ({ value: newSettings.timezone || 'Africa/Abidjan' }) },
        webhook_retries: { category: 'api', getValue: () => ({ value: newSettings.webhook_retries || '3' }) },
        enable_logging: { category: 'api', getValue: () => ({ value: newSettings.enable_logging ?? true }) },
        ip_whitelist: { category: 'security', getValue: () => ({ value: newSettings.ip_whitelist || '' }) },
      };

      for (const [key, config] of Object.entries(settingConfig)) {
        settingsToUpsert.push({
          user_id: user.id,
          key,
          value: config.getValue(),
          category: config.category,
          is_system: false,
        });
      }

      // Use upsert with onConflict - constraint is on (user_id, category, key)
      const { error } = await supabase
        .from('settings')
        .upsert(
          settingsToUpsert,
          { onConflict: 'user_id,category,key' }
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
