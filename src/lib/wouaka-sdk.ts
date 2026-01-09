/**
 * Wouaka SDK - Client TypeScript pour l'API Wouaka
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// ============= Types =============

export interface WouakaConfig {
  apiKey?: string;
}

export interface ScoreRequest {
  full_name?: string;
  phone_number?: string;
  national_id?: string;
  company_name?: string;
  rccm_number?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  mobile_money_transactions?: number;
  mobile_money_volume?: number;
  sim_age_months?: number;
  existing_loans?: number;
  utility_payments_on_time?: number;
  utility_payments_late?: number;
  years_in_business?: number;
  sector?: string;
  employment_type?: string;
  city?: string;
  region?: string;
}

export interface ScoreResponse {
  success: boolean;
  score?: number;
  risk_category?: 'EXCELLENT' | 'BON' | 'MOYEN' | 'RISQUÉ' | 'TRÈS RISQUÉ';
  confidence?: number;
  explanations?: string[];
  recommendations?: string[];
  feature_importance?: Record<string, number>;
  processing_time_ms?: number;
  model_version?: string;
  request_id?: string;
  error?: string;
}

export interface KycRequest {
  user_id?: string;
  document_type: 'national_id' | 'passport' | 'driver_license' | 'residence_permit';
  document_number?: string;
  document_url?: string;
}

export interface KycResponse {
  success: boolean;
  validation_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  identity_verified?: boolean;
  address_verified?: boolean;
  overall_score?: number;
  error?: string;
}

export interface IdentityCheckRequest {
  full_name: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
}

export interface IdentityCheckResponse {
  success: boolean;
  verified: boolean;
  confidence?: number;
  checks?: {
    name_match?: boolean;
    id_valid?: boolean;
    age_valid?: boolean;
  };
  error?: string;
}

export interface WebhookRequest {
  name: string;
  url: string;
  events: string[];
}

export interface WebhookResponse {
  success: boolean;
  webhook_id?: string;
  secret?: string;
  error?: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end?: string;
  plan?: SubscriptionPlan;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  role: string;
  permissions: Permission[];
}

export interface Setting {
  value: any;
  is_system: boolean;
  updated_at: string;
}

export type SettingsMap = Record<string, Record<string, Setting>>;

// ============= SDK Client =============

export class WouakaClient {
  private config: WouakaConfig;

  constructor(config: WouakaConfig = {}) {
    this.config = config;
  }

  private async invoke<T>(functionName: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
  } = {}): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      method: options.method || 'POST',
      body: options.body,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as T;
  }

  // ============= Scoring =============

  readonly scores = {
    /**
     * Calculer un score de crédit
     */
    create: async (request: ScoreRequest): Promise<ScoreResponse> => {
      return this.invoke<ScoreResponse>('partners-score', {
        method: 'POST',
        body: request,
      });
    },

    /**
     * Calculer un score avec le moteur interne (plus détaillé)
     */
    calculate: async (request: ScoreRequest): Promise<ScoreResponse> => {
      return this.invoke<ScoreResponse>('calculate-score', {
        method: 'POST',
        body: request,
      });
    },
  };

  // ============= KYC =============

  readonly kyc = {
    /**
     * Soumettre une vérification KYC
     */
    verify: async (request: KycRequest): Promise<KycResponse> => {
      return this.invoke<KycResponse>('partners-kyc', {
        method: 'POST',
        body: request,
      });
    },
  };

  // ============= Identity =============

  readonly identity = {
    /**
     * Vérifier une identité
     */
    check: async (request: IdentityCheckRequest): Promise<IdentityCheckResponse> => {
      return this.invoke<IdentityCheckResponse>('partners-identity', {
        method: 'POST',
        body: request,
      });
    },
  };

  // ============= Webhooks =============

  readonly webhooks = {
    /**
     * Enregistrer un nouveau webhook
     */
    register: async (request: WebhookRequest): Promise<WebhookResponse> => {
      return this.invoke<WebhookResponse>('partners-webhooks', {
        method: 'POST',
        body: { action: 'register', ...request },
      });
    },

    /**
     * Tester un webhook
     */
    test: async (webhookId: string): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>('partners-webhooks', {
        method: 'POST',
        body: { action: 'test', webhook_id: webhookId },
      });
    },

    /**
     * Lister les webhooks
     */
    list: async (): Promise<{ success: boolean; data: any[] }> => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    },
  };

  // ============= API Keys =============

  readonly apiKeys = {
    /**
     * Lister les clés API
     */
    list: async (): Promise<{ success: boolean; data: ApiKeyInfo[] }> => {
      return this.invoke<{ success: boolean; data: ApiKeyInfo[] }>('partners-api-keys', {
        method: 'GET',
      });
    },

    /**
     * Créer une clé API
     */
    create: async (name: string, permissions?: string[], expiresInDays?: number): Promise<{ success: boolean; data: ApiKeyInfo & { key: string } }> => {
      return this.invoke<{ success: boolean; data: ApiKeyInfo & { key: string } }>('partners-api-keys', {
        method: 'POST',
        body: { name, permissions, expires_in_days: expiresInDays },
      });
    },

    /**
     * Régénérer une clé API
     */
    rotate: async (keyId: string): Promise<{ success: boolean; data: ApiKeyInfo & { key: string } }> => {
      return this.invoke<{ success: boolean; data: ApiKeyInfo & { key: string } }>(`partners-api-keys/${keyId}`, {
        method: 'PUT',
        body: { rotate: true },
      });
    },

    /**
     * Supprimer une clé API
     */
    delete: async (keyId: string): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>(`partners-api-keys/${keyId}`, {
        method: 'DELETE',
      });
    },
  };

  // ============= Subscriptions =============

  readonly subscriptions = {
    /**
     * Obtenir les plans disponibles
     */
    getPlans: async (): Promise<{ success: boolean; data: SubscriptionPlan[] }> => {
      return this.invoke<{ success: boolean; data: SubscriptionPlan[] }>('subscriptions/plans', {
        method: 'GET',
      });
    },

    /**
     * Obtenir l'abonnement actuel
     */
    getCurrent: async (): Promise<{ success: boolean; data: Subscription | null }> => {
      return this.invoke<{ success: boolean; data: Subscription | null }>('subscriptions', {
        method: 'GET',
      });
    },

    /**
     * Souscrire à un plan
     */
    subscribe: async (planId: string, metadata?: Record<string, any>): Promise<{ success: boolean; data: Subscription }> => {
      return this.invoke<{ success: boolean; data: Subscription }>('subscriptions', {
        method: 'POST',
        body: { plan_id: planId, metadata },
      });
    },

    /**
     * Changer de plan
     */
    changePlan: async (planId: string): Promise<{ success: boolean; data: Subscription }> => {
      return this.invoke<{ success: boolean; data: Subscription }>('subscriptions', {
        method: 'PUT',
        body: { plan_id: planId },
      });
    },

    /**
     * Annuler l'abonnement
     */
    cancel: async (): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>('subscriptions', {
        method: 'DELETE',
      });
    },
  };

  // ============= Settings =============

  readonly settings = {
    /**
     * Obtenir tous les paramètres
     */
    getAll: async (category?: string): Promise<{ success: boolean; data: SettingsMap }> => {
      const url = category ? `settings?category=${category}` : 'settings';
      return this.invoke<{ success: boolean; data: SettingsMap }>(url, {
        method: 'GET',
      });
    },

    /**
     * Définir un paramètre
     */
    set: async (category: string, key: string, value: any): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>('settings', {
        method: 'POST',
        body: { category, key, value },
      });
    },

    /**
     * Mettre à jour plusieurs paramètres
     */
    bulkUpdate: async (settings: Record<string, Record<string, any>>): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>('settings', {
        method: 'PUT',
        body: settings,
      });
    },

    /**
     * Supprimer un paramètre
     */
    delete: async (category: string, key: string): Promise<{ success: boolean }> => {
      return this.invoke<{ success: boolean }>(`settings?category=${category}&key=${key}`, {
        method: 'DELETE',
      });
    },
  };

  // ============= Permissions =============

  readonly permissions = {
    /**
     * Obtenir toutes les permissions
     */
    list: async (): Promise<{ success: boolean; data: Permission[] }> => {
      return this.invoke<{ success: boolean; data: Permission[] }>('permissions', {
        method: 'GET',
      });
    },

    /**
     * Obtenir mes permissions
     */
    getMine: async (): Promise<{ success: boolean; data: UserPermissions }> => {
      return this.invoke<{ success: boolean; data: UserPermissions }>('permissions/my', {
        method: 'GET',
      });
    },

    /**
     * Vérifier une permission
     */
    check: async (permission: string): Promise<{ success: boolean; has_permission: boolean; role?: string }> => {
      return this.invoke<{ success: boolean; has_permission: boolean; role?: string }>(`permissions/check?permission=${permission}`, {
        method: 'GET',
      });
    },

    /**
     * Obtenir les permissions par rôle
     */
    getByRole: async (): Promise<{ success: boolean; data: Record<string, Permission[]> }> => {
      return this.invoke<{ success: boolean; data: Record<string, Permission[]> }>('permissions/roles', {
        method: 'GET',
      });
    },
  };

  // ============= Audit Logs =============

  readonly audit = {
    /**
     * Lister les logs d'audit
     */
    list: async (limit = 50): Promise<{ success: boolean; data: any[] }> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    },
  };

  // ============= Notifications =============

  readonly notifications = {
    /**
     * Lister les notifications
     */
    list: async (unreadOnly = false): Promise<{ success: boolean; data: any[] }> => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    },

    /**
     * Marquer comme lue
     */
    markAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    },

    /**
     * Marquer toutes comme lues
     */
    markAllAsRead: async (): Promise<{ success: boolean }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    },
  };
}

// Export singleton instance
export const wouaka = new WouakaClient();
