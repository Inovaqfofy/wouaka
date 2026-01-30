import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle2,
  Phone,
  FileText,
  Camera,
  Users,
  Fingerprint,
  Sparkles,
  Crown
} from 'lucide-react';
import { 
  FREE_VERIFICATION_LEVELS, 
  VERIFICATION_PRICES, 
  VerificationType,
  formatPrice 
} from '@/lib/verification-pricing';

export type VerificationLevel = 'basic' | 'enhanced' | VerificationType;

interface VerificationLevelSelectorProps {
  selectedLevel: VerificationLevel;
  onSelectLevel: (level: VerificationLevel) => void;
  onContinue: () => void;
}

const levelIcons: Record<string, React.ReactNode> = {
  basic: <Shield className="h-6 w-6" />,
  enhanced: <ShieldCheck className="h-6 w-6" />,
  smile_id_basic: <ShieldAlert className="h-6 w-6" />,
  smile_id_enhanced: <Fingerprint className="h-6 w-6" />,
  smile_id_biometric: <Crown className="h-6 w-6" />,
};

const featureIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  ocr: <FileText className="h-4 w-4" />,
  liveness: <Camera className="h-4 w-4" />,
  face: <Users className="h-4 w-4" />,
  fingerprint: <Fingerprint className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
};

export function VerificationLevelSelector({
  selectedLevel,
  onSelectLevel,
  onContinue,
}: VerificationLevelSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Niveau de vérification</h2>
        <p className="text-muted-foreground">
          Choisissez le niveau de vérification d'identité pour ce client
        </p>
      </div>

      <RadioGroup
        value={selectedLevel}
        onValueChange={(value) => onSelectLevel(value as VerificationLevel)}
        className="grid gap-4"
      >
        {/* Free levels */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Gratuit
          </h3>
          
          {/* Basic */}
          <Label
            htmlFor="basic"
            className="cursor-pointer"
          >
            <Card className={`transition-all ${selectedLevel === 'basic' ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="basic" id="basic" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {levelIcons.basic}
                        <span className="font-semibold">{FREE_VERIFICATION_LEVELS.basic.label}</span>
                      </div>
                      <Badge variant="secondary">Gratuit</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {FREE_VERIFICATION_LEVELS.basic.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {FREE_VERIFICATION_LEVELS.basic.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Label>

          {/* Enhanced */}
          <Label
            htmlFor="enhanced"
            className="cursor-pointer"
          >
            <Card className={`transition-all ${selectedLevel === 'enhanced' ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <RadioGroupItem value="enhanced" id="enhanced" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {levelIcons.enhanced}
                        <span className="font-semibold">{FREE_VERIFICATION_LEVELS.enhanced.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Gratuit</Badge>
                        <Badge className="bg-green-500">Recommandé</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {FREE_VERIFICATION_LEVELS.enhanced.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {FREE_VERIFICATION_LEVELS.enhanced.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                      +{FREE_VERIFICATION_LEVELS.enhanced.scoreBonus} points au score
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>

        {/* Premium levels */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Premium — Vérification officielle
          </h3>
          
          {(Object.entries(VERIFICATION_PRICES) as [VerificationType, typeof VERIFICATION_PRICES[VerificationType]][]).map(([type, config]) => (
            <Label
              key={type}
              htmlFor={type}
              className="cursor-pointer"
            >
              <Card className={`transition-all ${selectedLevel === type ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value={type} id={type} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {levelIcons[type]}
                          <span className="font-semibold">{config.label}</span>
                        </div>
                        <Badge className="bg-primary">{formatPrice(config.price)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {config.features.map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-muted-foreground">
                          ⏱️ {config.estimatedTime}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          +{type === 'smile_id_basic' ? 10 : type === 'smile_id_enhanced' ? 15 : 20} points au score
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button onClick={onContinue} size="lg">
          Continuer
        </Button>
      </div>
    </div>
  );
}
