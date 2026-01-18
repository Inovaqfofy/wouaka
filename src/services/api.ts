/**
 * Wouaka API Services
 * Centralized API service layer using the Wouaka SDK
 */

import { wouaka } from '@/lib/wouaka-sdk';

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
// Score Service
// ============================================
export const scoreService = {
  async calculateScore(data: Parameters<typeof wouaka.scores.calculate>[0]) {
    return wouaka.scores.calculate(data);
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
// KYC Service
// ============================================
export const kycService = {
  async verify(data: Parameters<typeof wouaka.kyc.verify>[0]) {
    return wouaka.kyc.verify(data);
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
// Partners Service (API Keys & Webhooks)
// ============================================
export const partnersService = {
  // API Keys
  async getApiKeys() {
    return wouaka.apiKeys.list();
  },

  async createApiKey(name: string, permissions?: string[], expiresInDays?: number) {
    return wouaka.apiKeys.create(name, permissions, expiresInDays);
  },

  async rotateApiKey(keyId: string) {
    return wouaka.apiKeys.rotate(keyId);
  },

  async deleteApiKey(keyId: string) {
    return wouaka.apiKeys.delete(keyId);
  },

  // Webhooks
  async getWebhooks() {
    return wouaka.webhooks.list();
  },

  async createWebhook(url: string, events: string[], name: string) {
    return wouaka.webhooks.register({ url, events, name });
  },

  async testWebhook(webhookId: string) {
    return wouaka.webhooks.test(webhookId);
  },
};

// ============================================
// Webhooks Service
// ============================================
export const webhooksService = {
  async register(url: string, events: string[], name: string) {
    return wouaka.webhooks.register({ url, events, name });
  },

  async test(webhookId: string) {
    return wouaka.webhooks.test(webhookId);
  },

  async list() {
    return wouaka.webhooks.list();
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
// Subscriptions Service
// ============================================
export const subscriptionsService = {
  async getPlans() {
    return wouaka.subscriptions.getPlans();
  },

  async getCurrentSubscription() {
    return wouaka.subscriptions.getCurrent();
  },

  async subscribe(planId: string) {
    return wouaka.subscriptions.subscribe(planId);
  },

  async cancel() {
    return wouaka.subscriptions.cancel();
  },
};

// ============================================
// Settings Service
// ============================================
export const settingsService = {
  async getAll(category?: string) {
    return wouaka.settings.getAll(category);
  },

  async set(category: string, key: string, value: unknown) {
    return wouaka.settings.set(category, key, value);
  },

  async delete(category: string, key: string) {
    return wouaka.settings.delete(category, key);
  },

  async bulkUpdate(settings: Record<string, Record<string, unknown>>) {
    return wouaka.settings.bulkUpdate(settings);
  },
};

// ============================================
// Audit Service
// ============================================
export const auditService = {
  async getLogs(limit?: number) {
    return wouaka.audit.list(limit);
  },
};

// ============================================
// Notifications Service
// ============================================
export const notificationsService = {
  async list(unreadOnly?: boolean) {
    return wouaka.notifications.list(unreadOnly);
  },

  async markAsRead(notificationId: string) {
    return wouaka.notifications.markAsRead(notificationId);
  },

  async markAllAsRead() {
    return wouaka.notifications.markAllAsRead();
  },
};

// Export SDK instance for direct access
export { wouaka as wouakaSDK };
