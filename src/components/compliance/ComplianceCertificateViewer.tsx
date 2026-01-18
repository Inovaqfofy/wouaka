import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Globe,
  Database,
  Brain,
  Users,
  Fingerprint,
  Smartphone,
  Wallet,
  TrendingUp,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ComplianceCertificate } from '@/lib/compliance-certificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  WOUAKA_LOGO_BASE64, 
  SECURITY_SEAL_BASE64, 
  BCEAO_BADGE_BASE64,
  PRODUCTION_DOMAIN,
  SITE_CONFIG,
  COMPANY_INFO,
} from '@/lib/app-config';

interface ComplianceCertificateViewerProps {
  certificate: ComplianceCertificate;
  isVerified: boolean | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ComplianceCertificateViewer({
  certificate,
  isVerified,
  onRefresh,
  isLoading,
}: ComplianceCertificateViewerProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const gradeColors = {
    GOLD: 'bg-yellow-500',
    SILVER: 'bg-slate-400',
    BRONZE: 'bg-amber-700',
    PENDING: 'bg-gray-500',
  };

  const gradeTextColors = {
    GOLD: 'text-yellow-600',
    SILVER: 'text-slate-500',
    BRONZE: 'text-amber-700',
    PENDING: 'text-gray-500',
  };

  // Prepare radar chart data
  const radarData = [
    {
      subject: 'Identité',
      value: certificate.data_distribution.identity_certified.percentage,
      fullMark: 30,
    },
    {
      subject: 'Mobile',
      value: certificate.data_distribution.mobile_ownership.percentage,
      fullMark: 30,
    },
    {
      subject: 'Financier',
      value: certificate.data_distribution.financial_history.percentage,
      fullMark: 30,
    },
    {
      subject: 'Social',
      value: certificate.data_distribution.social_capital.percentage,
      fullMark: 30,
    },
    {
      subject: 'Comportemental',
      value: certificate.data_distribution.behavioral.percentage,
      fullMark: 30,
    },
    {
      subject: 'Environnement',
      value: certificate.data_distribution.environmental.percentage,
      fullMark: 30,
    },
  ];

  // Prepare security bar chart data
  const securityData = [
    { name: 'Rate Limiting', score: certificate.security_index.components.rate_limiting.score },
    { name: 'RLS Strict', score: certificate.security_index.components.rls_strict.score },
    { name: 'PII Masking', score: certificate.security_index.components.pii_masking.score },
    { name: 'Validation', score: certificate.security_index.components.input_validation.score },
    { name: 'Audit Logs', score: certificate.security_index.components.audit_logging.score },
  ];

  const exportToPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`WOUAKA_Compliance_Certificate_${certificate.certificate_id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isVerified === true && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Signature vérifiée
            </Badge>
          )}
          {isVerified === false && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Signature invalide
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          )}
          <Button onClick={exportToPDF} className="bg-primary">
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Certificate Content */}
      <div ref={certificateRef} className="bg-white p-8 rounded-lg shadow-lg border">
        {/* Header with embedded logos for PDF export */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Logo embedded as Base64 for reliable PDF export */}
            <img 
              src={WOUAKA_LOGO_BASE64} 
              alt="Wouaka Logo" 
              className="h-14 w-14 rounded-xl"
              crossOrigin="anonymous"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                WOUAKA Technical Compliance Certificate
              </h1>
              <p className="text-sm text-gray-500">Certificat de Conformité Technique</p>
              <p className="text-xs text-gray-400 mt-1">{PRODUCTION_DOMAIN}</p>
            </div>
            {/* Security seal */}
            <img 
              src={SECURITY_SEAL_BASE64} 
              alt="Security Seal" 
              className="h-12 w-12"
              crossOrigin="anonymous"
            />
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className={`px-6 py-3 rounded-full ${gradeColors[certificate.compliance_grade]} text-white font-bold text-2xl`}>
              {certificate.compliance_grade}
            </div>
            <div className="text-left">
              <div className="text-4xl font-bold text-gray-900">
                {certificate.overall_compliance_score}%
              </div>
              <div className="text-sm text-gray-500">Score de Conformité</div>
            </div>
          </div>
        </div>

        {/* Certificate Info */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-sm bg-gray-50 p-4 rounded-lg">
          <div>
            <span className="text-gray-500">ID Certificat:</span>
            <p className="font-mono text-xs">{certificate.certificate_id}</p>
          </div>
          <div>
            <span className="text-gray-500">Généré le:</span>
            <p className="font-medium">
              {format(new Date(certificate.generated_at), 'PPP', { locale: fr })}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Valide jusqu'au:</span>
            <p className="font-medium">
              {format(new Date(certificate.valid_until), 'PPP', { locale: fr })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Security Index */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Indice de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold">{certificate.security_index.score}%</div>
                  <Badge variant="outline" className={gradeTextColors[certificate.compliance_grade]}>
                    Grade {certificate.security_index.grade}
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={securityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sovereignty Proof */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Preuve de Souveraineté
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  {certificate.sovereignty_proof.no_external_ai_calls ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Aucun appel IA externe</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>Résidence données: <strong>{certificate.sovereignty_proof.data_residency}</strong></span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Modèles IA locaux:</p>
                  {certificate.sovereignty_proof.local_models.map((model, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <span className="font-medium">{model.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.runtime.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AML Audit */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Audit AML/Sanctions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Screening actif:</span>
                  {certificate.aml_audit.screening_enabled ? (
                    <Badge className="bg-green-100 text-green-700">Actif</Badge>
                  ) : (
                    <Badge variant="destructive">Inactif</Badge>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Total entrées:</span>
                  <span className="ml-2 font-bold">{certificate.aml_audit.total_entries}</span>
                </div>
                {certificate.aml_audit.last_sync_date && (
                  <div className="text-sm">
                    <span className="text-gray-500">Dernière sync:</span>
                    <span className="ml-2">
                      {format(new Date(certificate.aml_audit.last_sync_date), 'PPp', { locale: fr })}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  {certificate.aml_audit.sources_synced.map((source, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{source.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{source.entries_count} entrées</span>
                        {source.status === 'active' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Data Distribution Radar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Répartition Sources de Données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 30]} />
                    <Radar
                      name="Distribution"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Fingerprint className="h-4 w-4 text-blue-500" />
                    <span>Identité: {certificate.data_distribution.identity_certified.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span>Mobile: {certificate.data_distribution.mobile_ownership.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="h-4 w-4 text-orange-500" />
                    <span>Financier: {certificate.data_distribution.financial_history.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Social: {certificate.data_distribution.social_capital.percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scoring Validity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Validité du Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Version moteur:</span>
                  <Badge variant="outline" className="font-mono">
                    {certificate.scoring_validity.engine_version}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Couche de Confiance:</span>
                  {certificate.scoring_validity.confidence_layer_active ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <Separator />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-gray-500">Coefficients de Source:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-bold text-green-700">
                        {certificate.scoring_validity.source_coefficients.hard_proof}
                      </div>
                      <div className="text-gray-500">Hard</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="font-bold text-yellow-700">
                        {certificate.scoring_validity.source_coefficients.soft_proof}
                      </div>
                      <div className="text-gray-500">Soft</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="font-bold text-red-700">
                        {certificate.scoring_validity.source_coefficients.declarative}
                      </div>
                      <div className="text-gray-500">Déclaratif</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <div className="font-bold">{certificate.scoring_validity.features_count}</div>
                    <div className="text-gray-500">Features</div>
                  </div>
                  <div>
                    <div className="font-bold">{certificate.scoring_validity.sub_scores_count}</div>
                    <div className="text-gray-500">Sub-scores</div>
                  </div>
                  <div>
                    <div className="font-bold">{certificate.scoring_validity.fraud_rules_count}</div>
                    <div className="text-gray-500">Règles Fraude</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Audit */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-cyan-600" />
                  Audit Base de Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-bold text-blue-700">{certificate.database_audit.total_tables}</div>
                    <div className="text-xs text-gray-500">Tables</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-bold text-green-700">{certificate.database_audit.tables_with_rls}</div>
                    <div className="text-xs text-gray-500">RLS Actif</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="font-bold text-purple-700">
                      {certificate.database_audit.referential_integrity.foreign_keys_count}
                    </div>
                    <div className="text-xs text-gray-500">FK</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Intégrité référentielle:</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={certificate.database_audit.referential_integrity.integrity_score}
                      className="w-20 h-2"
                    />
                    <span className="font-bold">
                      {certificate.database_audit.referential_integrity.integrity_score}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legal Mentions */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Mentions Légales & Conformité
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            {certificate.legal_mentions.map((mention, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {mention}
              </li>
            ))}
          </ul>
        </div>

        {/* Digital Signature & Footer */}
        <div className="mt-6 pt-4 border-t bg-gray-50 -mx-8 -mb-8 px-8 pb-6 rounded-b-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">Signature numérique ({certificate.signature_algorithm}):</p>
              <p className="font-mono text-xs text-gray-700 break-all max-w-lg">
                {certificate.digital_signature}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isVerified === true && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              )}
              {isVerified === false && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Non vérifié
                </Badge>
              )}
            </div>
          </div>
          
          {/* Company Footer for PDF */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <img 
                src={BCEAO_BADGE_BASE64} 
                alt="BCEAO Compliant" 
                className="h-6 w-6"
                crossOrigin="anonymous"
              />
              <span>Conforme BCEAO/UEMOA</span>
            </div>
            <div className="text-right">
              <p>{COMPANY_INFO.legalName} | RCCM: {COMPANY_INFO.rccm}</p>
              <p>{PRODUCTION_DOMAIN}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
