import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { Phone, Shield, CheckCircle2, Loader2, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneVerificationOTPProps {
  phoneNumber: string;
  onPhoneChange?: (phone: string) => void;
  onVerified: (token: string, phone: string) => void;
  partnerId?: string;
  purpose?: 'kyc' | 'login' | 'transaction';
  disabled?: boolean;
}

export const PhoneVerificationOTP: React.FC<PhoneVerificationOTPProps> = ({
  phoneNumber,
  onPhoneChange,
  onVerified,
  partnerId,
  purpose = 'kyc',
  disabled = false
}) => {
  const [phone, setPhone] = useState(phoneNumber);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const {
    isSending,
    isVerifying,
    codeSent,
    isVerified,
    maskedPhone,
    sendOTP,
    verifyOTP,
    reset
  } = usePhoneVerification();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Sync phone with parent
  useEffect(() => {
    setPhone(phoneNumber);
  }, [phoneNumber]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    onPhoneChange?.(value);
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 8) return;
    
    const success = await sendOTP({ 
      phone_number: phone, 
      purpose, 
      partner_id: partnerId 
    });
    
    if (success) {
      setCountdown(60); // 60 seconds before resend
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;
    
    const result = await verifyOTP({ 
      phone_number: phone, 
      otp_code: otpCode, 
      purpose 
    });
    
    if (result.success && result.verification_token) {
      onVerified(result.verification_token, result.phone_number || phone);
    }
  };

  const handleResend = () => {
    setOtpCode('');
    reset();
    handleSendOTP();
  };

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Numéro vérifié
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {maskedPhone || phone}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto border-green-500 text-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Vérifié
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5" />
          Vérification du téléphone
        </CardTitle>
        <CardDescription>
          {codeSent 
            ? `Entrez le code à 6 chiffres envoyé au ${maskedPhone}`
            : "Un code sera envoyé par SMS pour vérifier ce numéro"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          // Step 1: Enter phone number
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <div className="w-20">
                  <Input 
                    value="+225" 
                    disabled 
                    className="text-center bg-muted"
                  />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  value={phone.replace(/^\+?225/, '')}
                  onChange={(e) => handlePhoneChange('+225' + e.target.value.replace(/\D/g, ''))}
                  disabled={disabled || isSending}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: 07/05/01 XX XX XX XX (Côte d'Ivoire)
              </p>
            </div>
            
            <Button 
              onClick={handleSendOTP}
              disabled={disabled || isSending || phone.length < 10}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Envoyer le code SMS
                </>
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Enter OTP code
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              
              <p className="text-sm text-muted-foreground text-center">
                Code envoyé au {maskedPhone}
              </p>
            </div>

            <Button 
              onClick={handleVerify}
              disabled={isVerifying || otpCode.length !== 6}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Vérifier le code
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm">
              {countdown > 0 ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Renvoyer dans {countdown}s
                </span>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResend}
                  disabled={isSending}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1", isSending && "animate-spin")} />
                  Renvoyer le code
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Security info */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <Shield className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Vérification sécurisée</p>
            <p>En Côte d'Ivoire, les cartes SIM sont liées à la CNI via l'ARTCI. 
            Cette vérification permet de confirmer l'identité du propriétaire du numéro.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
