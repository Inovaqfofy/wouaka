/**
 * PHONE TRUST INTEGRATION HOOK
 * Connects phone certification flow to backend persistence
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  markOtpVerified,
  processUssdScreenshot,
  processSmsHistory,
  getOrCreatePhoneTrust,
  type PhoneTrustState,
} from '@/lib/trust-graph/phone-trust-validator';
import { useToast } from './use-toast';

export interface PhoneTrustIntegrationResult {
  phoneTrust: PhoneTrustState | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  initializeTrust: (phoneNumber: string) => Promise<PhoneTrustState>;
  completeOtpVerification: (phoneNumber: string, token: string) => Promise<void>;
  submitUssdScreenshot: (phoneNumber: string, file: File, cniName?: string) => Promise<void>;
  submitSmsHistory: (phoneNumber: string, messages: any[], consentId: string) => Promise<void>;
  checkPhoneFraud: (phoneNumber: string) => Promise<{ isDuplicate: boolean; existingUserId?: string }>;
}

export function usePhoneTrustIntegration(): PhoneTrustIntegrationResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phoneTrust, setPhoneTrust] = useState<PhoneTrustState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTrust = useCallback(async (phoneNumber: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const state = await getOrCreatePhoneTrust(phoneNumber, user.id);
      setPhoneTrust(state);
      return state;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const completeOtpVerification = useCallback(async (
    phoneNumber: string,
    token: string
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const state = await markOtpVerified(phoneNumber, user.id, token);
      setPhoneTrust(state);
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'phone_otp_verified',
        entity_type: 'phone_trust',
        entity_id: phoneNumber,
        new_values: { verified: true },
      });
      
      toast({
        title: 'Numéro vérifié',
        description: 'Votre numéro a été vérifié avec succès',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de vérification';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const submitUssdScreenshot = useCallback(async (
    phoneNumber: string,
    file: File,
    cniName?: string
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const { state, validation } = await processUssdScreenshot(
        phoneNumber,
        user.id,
        file,
        cniName
      );
      setPhoneTrust(state);
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ussd_screenshot_uploaded',
        entity_type: 'phone_trust',
        entity_id: phoneNumber,
        new_values: { 
          validation_score: validation.score,
          can_certify: validation.canCertify,
        },
      });
      
      toast({
        title: validation.canCertify ? 'Capture validée' : 'Capture reçue',
        description: validation.canCertify 
          ? 'Votre profil Mobile Money a été certifié'
          : 'La capture est en cours de vérification',
        variant: validation.canCertify ? 'default' : 'default',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'analyse';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const submitSmsHistory = useCallback(async (
    phoneNumber: string,
    messages: any[],
    consentId: string
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const { state, extraction } = await processSmsHistory(
        phoneNumber,
        user.id,
        messages,
        consentId
      );
      setPhoneTrust(state);
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'sms_analyzed',
        entity_type: 'phone_trust',
        entity_id: phoneNumber,
        new_values: {
          transactions_found: extraction.transactions.length,
          utility_bills_found: extraction.utilityBills.length,
        },
      });
      
      // Log consent
      await supabase.from('consent_logs').insert({
        user_id: user.id,
        consent_type: 'sms_analysis',
        consent_given: true,
        consent_text: 'Autorisation analyse SMS Mobile Money',
      });
      
      toast({
        title: 'Analyse SMS terminée',
        description: `${extraction.transactions.length} transactions et ${extraction.utilityBills.length} factures détectées`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'analyse';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const checkPhoneFraud = useCallback(async (phoneNumber: string): Promise<{
    isDuplicate: boolean;
    existingUserId?: string;
  }> => {
    if (!user?.id) throw new Error('User not authenticated');
    
    // Check if phone is already verified by another user
    const { data: existing } = await supabase
      .from('phone_trust_scores')
      .select('user_id, otp_verified')
      .eq('phone_number', phoneNumber)
      .eq('otp_verified', true)
      .neq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      // Create fraud detection record
      await supabase.from('identity_fraud_risk').insert({
        user_id: user.id,
        risk_type: 'duplicate_phone',
        risk_level: 'high',
        overall_risk_score: 80,
        duplicate_identity_suspected: true,
        indicators: { 
          existing_user_id: existing.user_id,
          phone_number: phoneNumber,
        },
        investigation_status: 'pending',
      });
      
      // Create admin notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'fraud_alert',
        title: 'Téléphone dupliqué détecté',
        message: `Le numéro ${phoneNumber} est déjà certifié par un autre utilisateur`,
        priority: 'high',
        metadata: {
          existing_user_id: existing.user_id,
          new_user_id: user.id,
        },
      });
      
      return { isDuplicate: true, existingUserId: existing.user_id };
    }
    
    return { isDuplicate: false };
  }, [user?.id]);

  return {
    phoneTrust,
    loading,
    error,
    initializeTrust,
    completeOtpVerification,
    submitUssdScreenshot,
    submitSmsHistory,
    checkPhoneFraud,
  };
}
