/**
 * PHONE CERTIFICATION STEP
 * Étape obligatoire de certification du numéro après la capture CNI
 * Intègre : OTP, Capture USSD, Validation croisée
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UssdScreenshotUpload } from '@/components/trust/UssdScreenshotUpload';
import {
  Phone,
  Camera,
  Shield,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  Smartphone,
  FileText,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import type { UssdScreenshotResult } from '@/lib/trust-graph/ussd-screenshot-analyzer';

type ProofLevel = 'none' | 'low' | 'medium' | 'certified';

interface ProofStatusData {
  otp_verified: boolean;
  ussd_captured: boolean;
  name_matched: boolean;
  sms_analyzed: boolean;
}

interface PhoneCertificationStepProps {
  phoneNumber: string;
  identityName: string;
  onCertificationComplete: (result: CertificationResult) => void;
  onSkip?: () => void;
}

interface CertificationResult {
  phone_number: string;
  proof_level: ProofLevel;
  trust_score: number;
  proofs: ProofStatusData;
  ussd_validation?: UssdScreenshotResult;
  name_match_score?: number;
  certified_at?: string;
}

const PROOF_LEVELS: Record<ProofLevel, { label: string; color: string; min_score: number }> = {
  none: { label: 'Non vérifié', color: 'bg-muted text-muted-foreground', min_score: 0 },
  low: { label: 'Faible', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', min_score: 20 },
  medium: { label: 'Moyen', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', min_score: 50 },
  certified: { label: 'Certifié', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', min_score: 80 },
};

type CertificationStepType = 'otp' | 'ussd' | 'validation' | 'complete';

export function PhoneCertificationStep({
  phoneNumber,
  identityName,
  onCertificationComplete,
  onSkip,
}: PhoneCertificationStepProps) {
  const [currentStep, setCurrentStep] = useState<CertificationStepType>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [proofStatus, setProofStatus] = useState<ProofStatusData>({
    otp_verified: false,
    ussd_captured: false,
    name_matched: false,
    sms_analyzed: false,
  });
  const [ussdResult, setUssdResult] = useState<UssdScreenshotResult | null>(null);
  const [nameMatchScore, setNameMatchScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    sendOTP,
    verifyOTP,
    isSending,
    isVerifying,
    codeSent,
    isVerified: otpVerified,
    maskedPhone,
    expiresIn,
    reset: resetOTP,
  } = usePhoneVerification();

  // Calculate trust score
  const calculateTrustScore = (): number => {
    let score = 0;
    if (proofStatus.otp_verified || otpVerified) score += 25;
    if (proofStatus.ussd_captured) score += 25;
    if (proofStatus.name_matched) score += 35;
    if (proofStatus.sms_analyzed) score += 15;
    return score;
  };

  const getProofLevel = (score: number): ProofLevel => {
    if (score >= 80) return 'certified';
    if (score >= 50) return 'medium';
    if (score >= 20) return 'low';
    return 'none';
  };

  const trustScore = calculateTrustScore();
  const proofLevel = getProofLevel(trustScore);

  // Handle OTP sending
  const handleSendOTP = async () => {
    setError(null);
    try {
      await sendOTP({ phone_number: phoneNumber, purpose: 'kyc' });
    } catch (err) {
      setError('Erreur lors de l\'envoi du code');
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setError(null);
    try {
      const result = await verifyOTP({ 
        phone_number: phoneNumber, 
        otp_code: otpCode,
        purpose: 'kyc'
      });
      
      if (result?.success) {
        setProofStatus(prev => ({ ...prev, otp_verified: true }));
        setCurrentStep('ussd');
      } else {
        setError('Code incorrect ou expiré');
      }
    } catch (err) {
      setError('Erreur lors de la vérification du code');
    }
  };

  // Handle USSD screenshot validation
  const handleUssdValidated = (result: UssdScreenshotResult, canCertify: boolean) => {
    setUssdResult(result);
    const matchScore = result.nameMatchResult?.matchScore || 0;
    setProofStatus(prev => ({ 
      ...prev, 
      ussd_captured: true,
      name_matched: canCertify && matchScore >= 85,
    }));
    setNameMatchScore(matchScore);
    setCurrentStep('validation');
  };

  // Complete certification
  const handleCompleteCertification = () => {
    const result: CertificationResult = {
      phone_number: phoneNumber,
      proof_level: proofLevel,
      trust_score: trustScore,
      proofs: {
        ...proofStatus,
        otp_verified: proofStatus.otp_verified || otpVerified,
      },
      ussd_validation: ussdResult || undefined,
      name_match_score: nameMatchScore || undefined,
      certified_at: new Date().toISOString(),
    };
    onCertificationComplete(result);
  };

  // Auto-send OTP on mount if phone number is provided
  useEffect(() => {
    if (phoneNumber && !codeSent && !otpVerified) {
      handleSendOTP();
    }
  }, [phoneNumber]);

  const steps = [
    { id: 'otp', label: 'OTP', icon: Phone },
    { id: 'ussd', label: 'Capture MoMo', icon: Camera },
    { id: 'validation', label: 'Validation', icon: Shield },
    { id: 'complete', label: 'Terminé', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <Card className="card-premium">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="w-6 h-6 text-primary" />
          <CardTitle>Certification du Numéro</CardTitle>
        </div>
        <CardDescription className="max-w-md mx-auto">
          Prouvez que ce numéro vous appartient pour augmenter votre niveau de confiance
        </CardDescription>

        {/* Proof Level Badge */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Badge className={PROOF_LEVELS[proofLevel].color}>
            {PROOF_LEVELS[proofLevel].label}
          </Badge>
          <span className="text-2xl font-bold">{trustScore}%</span>
        </div>
        <Progress value={trustScore} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Indicators */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    isActive ? 'border-primary bg-primary/10 text-primary' : 
                    'border-muted bg-muted/30 text-muted-foreground'}
                `}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: OTP Verification */}
          {currentStep === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Phone className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-lg">Vérification par SMS</h3>
                <p className="text-sm text-muted-foreground">
                  {codeSent 
                    ? `Un code a été envoyé au ${maskedPhone || phoneNumber}`
                    : 'Nous allons envoyer un code SMS pour vérifier votre numéro'
                  }
                </p>
              </div>

              {!codeSent ? (
                <Button 
                  onClick={handleSendOTP} 
                  disabled={isSending} 
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Envoyer le code SMS
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={setOtpCode}
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
                  </div>

                  {expiresIn > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Code valide pendant encore {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        resetOTP();
                        setOtpCode('');
                        handleSendOTP();
                      }}
                      disabled={isSending}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renvoyer
                    </Button>
                    <Button 
                      onClick={handleVerifyOTP} 
                      disabled={isVerifying || otpCode.length < 6}
                      className="flex-1"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Vérifier
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: USSD Screenshot Capture */}
          {currentStep === 'ussd' && (
            <motion.div
              key="ussd"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Camera className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-lg">Capture du Profil Mobile Money</h3>
                <p className="text-sm text-muted-foreground">
                  Faites une capture d'écran de votre compte MoMo (via *122# ou l'app)
                </p>
              </div>

              {/* Pedagogical explanation */}
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="w-4 h-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Pourquoi cette étape ?</strong> Nous comparons le nom affiché sur votre 
                  compte Mobile Money avec celui de votre pièce d'identité pour certifier que vous êtes bien 
                  le propriétaire du numéro. L'image est analysée localement et n'est jamais stockée.
                </AlertDescription>
              </Alert>

              <UssdScreenshotUpload
                cniName={identityName}
                onAnalysisComplete={handleUssdValidated}
              />

              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('validation')}
                className="w-full text-muted-foreground"
              >
                Passer cette étape (niveau de confiance réduit)
              </Button>
            </motion.div>
          )}

          {/* Step 3: Validation Summary */}
          {currentStep === 'validation' && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <Shield className="w-12 h-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-lg">Résumé de la Certification</h3>
              </div>

              {/* Proof Checklist */}
              <div className="space-y-3">
                <ProofCheckItem
                  icon={Phone}
                  label="Possession du numéro (OTP)"
                  verified={proofStatus.otp_verified || otpVerified}
                  points={25}
                />
                <ProofCheckItem
                  icon={Camera}
                  label="Capture profil Mobile Money"
                  verified={proofStatus.ussd_captured}
                  points={25}
                />
                <ProofCheckItem
                  icon={FileText}
                  label="Correspondance nom CNI"
                  verified={proofStatus.name_matched}
                  points={35}
                  detail={nameMatchScore ? `${Math.round(nameMatchScore)}% de correspondance` : undefined}
                />
              </div>

              {/* Name Match Alert */}
              {ussdResult && !proofStatus.name_matched && ussdResult.extractedName && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Attention :</strong> Le nom sur votre Mobile Money ({ussdResult.extractedName}) 
                    ne correspond pas exactement à celui de votre CNI ({identityName}). 
                    Vous pouvez continuer mais votre niveau de confiance sera réduit.
                  </AlertDescription>
                </Alert>
              )}

              {/* Result Summary */}
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Niveau de Preuve Final</span>
                  <Badge className={PROOF_LEVELS[proofLevel].color}>
                    {PROOF_LEVELS[proofLevel].label}
                  </Badge>
                </div>
                <Progress value={trustScore} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Score de confiance : <strong>{trustScore}/100</strong>
                </p>
              </div>

              <Button onClick={handleCompleteCertification} className="w-full">
                Terminer la certification
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Option */}
        {onSkip && currentStep !== 'validation' && (
          <>
            <Separator />
            <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
              Passer la certification (non recommandé)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for proof checklist
function ProofCheckItem({
  icon: Icon,
  label,
  verified,
  points,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  verified: boolean;
  points: number;
  detail?: string;
}) {
  return (
    <div className={`
      flex items-center justify-between p-3 rounded-lg border transition-all
      ${verified ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-muted/30 border-border'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-full
          ${verified ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
        `}>
          {verified ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </div>
        <div>
          <span className={verified ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <Badge variant={verified ? 'default' : 'outline'} className={verified ? 'bg-green-500' : ''}>
        +{points} pts
      </Badge>
    </div>
  );
}
