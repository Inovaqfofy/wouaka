import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendOTPParams {
  phone_number: string;
  purpose?: 'kyc' | 'login' | 'transaction';
  partner_id?: string;
}

interface VerifyOTPParams {
  phone_number: string;
  otp_code: string;
  purpose?: 'kyc' | 'login' | 'transaction';
}

interface VerificationResult {
  success: boolean;
  verification_token?: string;
  phone_number?: string;
  verified_at?: string;
  error?: string;
}

export const usePhoneVerification = () => {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const { toast } = useToast();

  const sendOTP = async ({ phone_number, purpose = 'kyc', partner_id }: SendOTPParams): Promise<boolean> => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('sms-otp-send', {
        body: { phone_number, purpose, partner_id }
      });

      if (error) throw error;

      if (data?.success) {
        setCodeSent(true);
        setMaskedPhone(data.phone_masked || phone_number);
        setExpiresIn(data.expires_in_seconds || 600);
        toast({
          title: "Code envoyé",
          description: `Un code de vérification a été envoyé au ${data.phone_masked}`,
        });
        return true;
      } else {
        throw new Error(data?.error || 'Échec envoi SMS');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async ({ phone_number, otp_code, purpose = 'kyc' }: VerifyOTPParams): Promise<VerificationResult> => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('sms-otp-verify', {
        body: { phone_number, otp_code, purpose }
      });

      if (error) throw error;

      if (data?.success) {
        setIsVerified(true);
        setVerificationToken(data.verification_token);
        toast({
          title: "Téléphone vérifié",
          description: "Votre numéro a été vérifié avec succès",
        });
        return {
          success: true,
          verification_token: data.verification_token,
          phone_number: data.phone_number,
          verified_at: data.verified_at
        };
      } else {
        toast({
          title: "Code invalide",
          description: data?.error || 'Code incorrect',
          variant: "destructive",
        });
        return { success: false, error: data?.error };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de vérification';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setCodeSent(false);
    setIsVerified(false);
    setVerificationToken(null);
    setMaskedPhone('');
    setExpiresIn(0);
  };

  return {
    // States
    isSending,
    isVerifying,
    codeSent,
    isVerified,
    verificationToken,
    maskedPhone,
    expiresIn,
    // Actions
    sendOTP,
    verifyOTP,
    reset
  };
};
