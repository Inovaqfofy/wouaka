import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Eye, Code, Smartphone, Monitor } from 'lucide-react';
import {
  getWelcomeEmail,
  getOtpEmail,
  getKycSuccessEmail,
  getScoreReadyEmail,
  getSecurityAlertEmail,
  type EmailTemplate,
} from '@/lib/email-templates';

interface TemplatePreviewProps {
  template: EmailTemplate;
  title: string;
  description: string;
  sampleData: Record<string, any>;
}

const TEMPLATE_CONFIGS: TemplatePreviewProps[] = [
  {
    template: 'welcome',
    title: 'Bienvenue (Inscription)',
    description: 'Envoyé automatiquement après l\'inscription d\'un nouvel utilisateur',
    sampleData: { fullName: 'Kouamé Yao', email: 'kouame.yao@example.com' },
  },
  {
    template: 'otp',
    title: 'Validation OTP',
    description: 'Code de vérification pour la connexion ou les actions sensibles',
    sampleData: { fullName: 'Kouamé Yao', otpCode: '847291', expiresIn: 10 },
  },
  {
    template: 'kyc_success',
    title: 'Succès KYC / Certification',
    description: 'Confirmation de la validation du processus KYC',
    sampleData: {
      fullName: 'Kouamé Yao',
      certificationLevel: 'Premium (Niveau 3)',
      certificateId: 'WKC-2024-7A8B9C',
      validUntil: '15 Janvier 2026',
    },
  },
  {
    template: 'score_ready',
    title: 'Score Disponible',
    description: 'Notification quand un nouveau score WOUAKA est calculé',
    sampleData: {
      fullName: 'Kouamé Yao',
      scoreValue: 725,
      scoreTrend: 'up',
      lastUpdate: '17 Janvier 2025 à 14:30',
    },
  },
  {
    template: 'security_alert',
    title: 'Alerte Sécurité',
    description: 'Notification de connexion ou activité suspecte',
    sampleData: {
      fullName: 'Kouamé Yao',
      alertType: 'new_login',
      ipAddress: '41.207.185.xxx',
      location: 'Abidjan, Côte d\'Ivoire',
      device: 'Chrome sur Windows',
      timestamp: '17 Janvier 2025 à 09:45',
    },
  },
];

function getEmailHtml(template: EmailTemplate, data: Record<string, any>): string {
  switch (template) {
    case 'welcome':
      return getWelcomeEmail(data as any);
    case 'otp':
      return getOtpEmail(data as any);
    case 'kyc_success':
      return getKycSuccessEmail(data as any);
    case 'score_ready':
      return getScoreReadyEmail(data as any);
    case 'security_alert':
      return getSecurityAlertEmail(data as any);
    default:
      return '';
  }
}

export function EmailTemplatePreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('welcome');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  const currentConfig = TEMPLATE_CONFIGS.find((c) => c.template === selectedTemplate)!;
  const emailHtml = getEmailHtml(selectedTemplate, currentConfig.sampleData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Aperçu des Templates Email
          </h2>
          <p className="text-muted-foreground mt-1">
            5 templates automatisés aux couleurs de WOUAKA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
          <Button
            variant={showCode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="h-4 w-4 mr-1" />
            Code
          </Button>
        </div>
      </div>

      {/* Template Selector */}
      <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as EmailTemplate)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="welcome">Bienvenue</TabsTrigger>
          <TabsTrigger value="otp">OTP</TabsTrigger>
          <TabsTrigger value="kyc_success">KYC Succès</TabsTrigger>
          <TabsTrigger value="score_ready">Score</TabsTrigger>
          <TabsTrigger value="security_alert">Sécurité</TabsTrigger>
        </TabsList>

        {TEMPLATE_CONFIGS.map((config) => (
          <TabsContent key={config.template} value={config.template}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-gold" />
                      {config.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Automatisé
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {showCode ? (
                  <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {emailHtml}
                    </pre>
                  </div>
                ) : (
                  <div
                    className={`border rounded-lg overflow-hidden bg-gray-100 mx-auto transition-all ${
                      viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[700px]'
                    }`}
                  >
                    <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs text-gray-500">
                          Aperçu Email - {viewMode === 'mobile' ? 'Mobile' : 'Desktop'}
                        </span>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                    <iframe
                      srcDoc={emailHtml}
                      className="w-full border-0"
                      style={{ height: viewMode === 'mobile' ? '700px' : '800px' }}
                      title={`Email Preview - ${config.title}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Trigger Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">
            🔗 Déclencheurs Automatiques (Database Triggers)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-primary">→ INSERT on profiles</p>
              <p className="text-muted-foreground">Envoie le mail de Bienvenue</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-primary">→ INSERT on otp_verifications</p>
              <p className="text-muted-foreground">Envoie le code OTP</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-primary">→ UPDATE on certificates</p>
              <p className="text-muted-foreground">Envoie la confirmation KYC</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-primary">→ INSERT on scoring_requests</p>
              <p className="text-muted-foreground">Envoie le score disponible</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-primary">→ INSERT on identity_fraud_risk</p>
              <p className="text-muted-foreground">Envoie l'alerte sécurité</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
