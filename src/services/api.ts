/**
 * Wouaka API Services
 * Centralized API service layer using the official @wouaka/sdk
 * 
 * @deprecated Prefer using the hooks directly:
 * - useWouakaScore for scoring
 * - useWouakaKyc for KYC
 * - useWouakaCore for combined operations
 */

import { getWouakaClient } from '@/lib/wouaka-sdk-client';

// Get SDK client instance - returns null if no API key set
const getClient = () => {
  // Try to get API key from localStorage or session
  const storedKey = localStorage.getItem('wouaka_api_key');
  if (storedKey) {
    return getWouakaClient(storedKey);
  }
  return null;
};

// ============================================
// Auth Service
// ============================================
export const authService = {
  async login(email: string, password: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signup(email: string, password: string, metadata?: Record<string, unknown>) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUser() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};

// ============================================
// Score Service (uses @wouaka/sdk)
// ============================================
export const scoreService = {
  async calculateScore(data: any) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.scores.calculate(data);
  },

  async getScore(id: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.scores.get(id);
  },

  async listScores(limit = 50) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.scores.list({ limit });
  },

  async getHistory(limit = 50) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('scoring_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('scoring_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// KYC Service (uses @wouaka/sdk)
// ============================================
export const kycService = {
  async verify(data: any) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.kyc.verify(data);
  },

  async getVerification(id: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.kyc.get(id);
  },

  async listVerifications(limit = 50) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.kyc.list({ limit });
  },

  async getDocuments() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async uploadDocument(file: File, documentType: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${user.id}/${documentType}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// Partners Service (API Keys & Webhooks) - uses @wouaka/sdk
// ============================================
export const partnersService = {
  // API Keys
  async getApiKeys() {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.apiKeys.list();
  },

  async createApiKey(name: string, permissions?: string[], expiresInDays?: number) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.apiKeys.create({ name, permissions, expires_in_days: expiresInDays });
  },

  async rotateApiKey(keyId: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.apiKeys.rotate(keyId);
  },

  async deleteApiKey(keyId: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.apiKeys.revoke(keyId);
  },

  // Webhooks
  async getWebhooks() {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.list();
  },

  async createWebhook(url: string, events: string[], name?: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.create({ url, events, name });
  },

  async testWebhook(webhookId: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.test(webhookId);
  },
};

// ============================================
// Webhooks Service (uses @wouaka/sdk)
// ============================================
export const webhooksService = {
  async register(url: string, events: string[], name: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.create({ url, events, name });
  },

  async test(webhookId: string) {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.test(webhookId);
  },

  async list() {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.webhooks.list();
  },

  async getDeliveries(webhookId: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },
};

// ============================================
// Subscriptions Service (uses @wouaka/sdk)
// ============================================
export const subscriptionsService = {
  async getPlans() {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.usage.getQuota();
  },

  async getCurrentSubscription() {
    const client = getClient();
    if (!client) throw new Error('SDK client not initialized');
    return client.usage.getStats();
  },

  async subscribe(_planId: string) {
    // Direct DB operation - no SDK equivalent
    throw new Error('Use Supabase directly for subscriptions');
  },

  async cancel() {
    // Direct DB operation - no SDK equivalent
    throw new Error('Use Supabase directly for subscriptions');
  },
};

// ============================================
// Settings Service (uses Supabase directly)
// ============================================
export const settingsService = {
  async getAll(category?: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    let query = supabase.from('settings').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async set(category: string, key: string, value: unknown) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    // Cast to any to handle dynamic settings schema
    const { data, error } = await (supabase
      .from('settings') as any)
      .upsert({ 
        key, 
        value,
        category,
        user_id: user?.id 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(_category: string, key: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);
    if (error) throw error;
  },

  async bulkUpdate(settings: Record<string, Record<string, unknown>>) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    const records = Object.entries(settings).flatMap(([category, values]) =>
      Object.entries(values).map(([key, value]) => ({ 
        key, 
        value,
        category,
        user_id: user?.id 
      }))
    );
    // Cast to any to handle dynamic settings schema
    const { data, error } = await (supabase.from('settings') as any).upsert(records).select();
    if (error) throw error;
    return data;
  },
};

// ============================================
// Audit Service (uses Supabase directly)
// ============================================
export const auditService = {
  async getLogs(limit = 100) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
};

// ============================================
// Notifications Service (uses Supabase directly)
// ============================================
export const notificationsService = {
  async list(unreadOnly?: boolean) {
    const { supabase } = await import('@/integrations/supabase/client');
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('is_read', false);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) throw error;
  },
};

// Export type for SDK client access
export type { WouakaClient } from '@wouaka/sdk';
