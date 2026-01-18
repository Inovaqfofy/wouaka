import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  Signal,
  Building2,
  Lightbulb,
  Shield,
  Check,
  Loader2,
  Lock,
} from 'lucide-react';
import type { DataConsent, DataSourceType } from '@/lib/enrichment-types';

interface DataSource {
  type: DataSourceType;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const DATA_SOURCES: DataSource[] = [
  {
    type: 'mobile_money',
    label: 'Mobile Money',
    description: 'Historique des transactions de votre opérateur',
    icon: Smartphone,
    required: true,
  },
  {
    type: 'telecom',
    label: 'Données Télécom',
    description: 'Ancienneté SIM, régularité d\'usage, stabilité',
    icon: Signal,
    required: false,
  },
  {
    type: 'registry',
    label: 'Registre du Commerce',
    description: 'Vérification du statut de l\'entreprise',
    icon: Building2,
    required: false,
  },
  {
    type: 'utility',
    label: 'Factures Utilités',
    description: 'Historique de paiements des services',
    icon: Lightbulb,
    required: false,
  },
];

interface DataConsentFlowProps {
  phoneNumber: string;
  onConsentComplete: (consent: DataConsent) => void;
  onSkip: () => void;
  loading?: boolean;
}

export function DataConsentFlow({ 
  phoneNumber, 
  onConsentComplete, 
  onSkip,
  loading = false 
}: DataConsentFlowProps) {
  const [consents, setConsents] = useState<Record<DataSourceType, boolean>>({
    mobile_money: true,
    telecom: true,
    registry: false,
    utility: false,
    identity: false,
  });

  const [connecting, setConnecting] = useState<DataSourceType | null>(null);
  const [connected, setConnected] = useState<DataSourceType[]>([]);

  const toggleConsent = (type: DataSourceType) => {
    setConsents(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleConnect = async (type: DataSourceType) => {
    setConnecting(type);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnected(prev => [...prev, type]);
    setConnecting(null);
  };

  const handleSubmit = () => {
    const consent: DataConsent = {
      phone_number: phoneNumber,
      mobile_money_consent: consents.mobile_money,
      telecom_consent: consents.telecom,
      registry_consent: consents.registry,
      utility_consent: consents.utility,
    };
    onConsentComplete(consent);
  };

  const enabledCount = Object.values(consents).filter(Boolean).length;
  const connectedCount = connected.length;

  return (
    <Card className="card-premium">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <CardTitle>Connexion aux Sources de Données</CardTitle>
        </div>
        <CardDescription className="max-w-md mx-auto">
          Autorisez l'accès à vos données pour obtenir un score plus précis et une meilleure confiance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <Alert className="bg-primary/5 border-primary/20">
          <Lock className="w-4 h-4 text-primary" />
          <AlertDescription className="text-sm">
            Vos données sont chiffrées et utilisées uniquement pour le calcul de votre score.
            Nous ne les partageons jamais avec des tiers.
          </AlertDescription>
        </Alert>

        {/* Data Sources */}
        <div className="space-y-3">
          {DATA_SOURCES.map((source) => {
            const isConnected = connected.includes(source.type);
            const isConnecting = connecting === source.type;
            const isEnabled = consents[source.type];
            const Icon = source.icon;

            return (
              <motion.div
                key={source.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border transition-all ${
                  isEnabled 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      isConnected 
                        ? 'bg-green-100 text-green-700' 
                        : isEnabled 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isConnected ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{source.label}</span>
                        {source.required && (
                          <Badge variant="secondary" className="text-xs">
                            Recommandé
                          </Badge>
                        )}
                        {isConnected && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Connecté
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {source.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isEnabled && !isConnected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(source.type)}
                        disabled={isConnecting || loading}
                        className="shrink-0"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Connexion...
                          </>
                        ) : (
                          'Connecter'
                        )}
                      </Button>
                    )}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleConsent(source.type)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 py-4 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{enabledCount}</div>
            <div className="text-xs text-muted-foreground">Sources autorisées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
            <div className="text-xs text-muted-foreground">Sources connectées</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={loading}
            className="flex-1"
          >
            Continuer sans connexion
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || enabledCount === 0}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Chargement...
              </>
            ) : (
              <>
                Valider les autorisations
                {connectedCount > 0 && (
                  <Badge className="ml-2 bg-green-500">{connectedCount}</Badge>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
