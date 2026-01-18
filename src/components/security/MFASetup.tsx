import React, { useState } from "react";
import {
  Shield,
  Smartphone,
  Mail,
  Key,
  Check,
  Loader2,
  AlertTriangle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

type MFAMethod = "totp" | "sms" | "email";

interface MFASetupProps {
  userId: string;
  userPhone?: string;
  userEmail?: string;
  currentMethods?: MFAMethod[];
  onSetupComplete?: (method: MFAMethod) => void;
  onDisable?: (method: MFAMethod) => void;
}

export function MFASetup({
  userId,
  userPhone,
  userEmail,
  currentMethods = [],
  onSetupComplete,
  onDisable,
}: MFASetupProps) {
  const { toast } = useToast();
  const [activeSetup, setActiveSetup] = useState<MFAMethod | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpQRCode, setTotpQRCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const isMethodEnabled = (method: MFAMethod) => currentMethods.includes(method);

  const generateTOTPSecret = () => {
    // Generate a random 20-byte secret (base32 encoded)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const handleStartSetup = async (method: MFAMethod) => {
    setActiveSetup(method);
    setVerificationCode("");

    if (method === "totp") {
      const secret = generateTOTPSecret();
      setTotpSecret(secret);
      // In production, generate actual QR code
      setTotpQRCode(`otpauth://totp/WOUAKA:${userEmail}?secret=${secret}&issuer=WOUAKA`);
    } else if (method === "sms" || method === "email") {
      setIsSendingCode(true);
      // Simulate sending code
      await new Promise((r) => setTimeout(r, 1500));
      setIsSendingCode(false);
      toast({
        title: "Code envoyé",
        description: method === "sms" 
          ? `Code envoyé au ${userPhone}` 
          : `Code envoyé à ${userEmail}`,
      });
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;

    setIsVerifying(true);
    // Simulate verification
    await new Promise((r) => setTimeout(r, 1500));
    
    // In production, verify code against backend
    const success = true; // Simulate success
    
    setIsVerifying(false);

    if (success) {
      toast({
        title: "MFA activé",
        description: `L'authentification ${activeSetup?.toUpperCase()} est maintenant active.`,
      });
      onSetupComplete?.(activeSetup!);
      setActiveSetup(null);
      setTotpSecret(null);
      setTotpQRCode(null);
      setVerificationCode("");
    } else {
      toast({
        title: "Code invalide",
        description: "Veuillez vérifier le code et réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDisable = async (method: MFAMethod) => {
    // In production, call backend to disable
    toast({
      title: "MFA désactivé",
      description: `L'authentification ${method.toUpperCase()} a été désactivée.`,
    });
    onDisable?.(method);
  };

  const copySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      toast({ title: "Clé copiée" });
    }
  };

  return (
    <Card className="card-enterprise">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <CardTitle>Authentification Multi-Facteurs</CardTitle>
            <CardDescription>
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* TOTP Authenticator */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Application Authenticator</p>
              <p className="text-sm text-muted-foreground">
                Google Authenticator, Authy, 1Password
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMethodEnabled("totp") && (
              <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
            )}
            {isMethodEnabled("totp") ? (
              <Button variant="outline" size="sm" onClick={() => handleDisable("totp")}>
                Désactiver
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleStartSetup("totp")}>
                Configurer
              </Button>
            )}
          </div>
        </div>

        {/* TOTP Setup Flow */}
        {activeSetup === "totp" && totpSecret && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Scannez ce QR code</p>
                <div className="w-40 h-40 bg-white rounded-lg mx-auto flex items-center justify-center border">
                  {/* In production, render actual QR code */}
                  <div className="text-xs text-muted-foreground text-center p-2">
                    QR Code<br />
                    (Production: use qrcode library)
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ou entrez cette clé manuellement :</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-xs font-mono break-all">
                    {totpSecret}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm">Entrez le code à 6 chiffres</Label>
                <div className="flex items-center gap-4 mt-2">
                  <InputOTP value={verificationCode} onChange={setVerificationCode} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}>
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* SMS */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="font-medium">SMS</p>
              <p className="text-sm text-muted-foreground">
                {userPhone || "Aucun numéro configuré"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMethodEnabled("sms") && (
              <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
            )}
            {!userPhone ? (
              <Badge variant="outline">Requis: téléphone</Badge>
            ) : isMethodEnabled("sms") ? (
              <Button variant="outline" size="sm" onClick={() => handleDisable("sms")}>
                Désactiver
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleStartSetup("sms")}>
                Configurer
              </Button>
            )}
          </div>
        </div>

        {/* SMS Setup Flow */}
        {activeSetup === "sms" && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isSendingCode ? "Envoi du code..." : `Code envoyé au ${userPhone}`}
              </p>
              <div className="flex items-center gap-4">
                <InputOTP value={verificationCode} onChange={setVerificationCode} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}>
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier"}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleStartSetup("sms")} disabled={isSendingCode}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Renvoyer le code
              </Button>
            </div>
          </Card>
        )}

        {/* Email */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {userEmail || "Aucun email configuré"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMethodEnabled("email") && (
              <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
            )}
            {isMethodEnabled("email") ? (
              <Button variant="outline" size="sm" onClick={() => handleDisable("email")}>
                Désactiver
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleStartSetup("email")}>
                Configurer
              </Button>
            )}
          </div>
        </div>

        {/* Email Setup Flow */}
        {activeSetup === "email" && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isSendingCode ? "Envoi du code..." : `Code envoyé à ${userEmail}`}
              </p>
              <div className="flex items-center gap-4">
                <InputOTP value={verificationCode} onChange={setVerificationCode} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}>
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vérifier"}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleStartSetup("email")} disabled={isSendingCode}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Renvoyer le code
              </Button>
            </div>
          </Card>
        )}

        {/* Warning */}
        {currentMethods.length === 0 && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">MFA non activé</p>
              <p className="text-sm text-muted-foreground">
                Nous recommandons fortement d'activer au moins une méthode MFA pour sécuriser votre compte partenaire.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
