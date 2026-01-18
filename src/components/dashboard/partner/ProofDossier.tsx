/**
 * PROOF DOSSIER
 * Vue détaillée du "Dossier de Preuves" pour les partenaires
 * Remplace le simple score par un certificat complet
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Phone,
  FileText,
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  MapPin,
  Building2,
  User,
  Clock,
  Eye,
  Download,
  ExternalLink,
  Info,
  Lock,
  Fingerprint,
} from 'lucide-react';
import { ScoreGauge } from '@/components/scoring/ScoreGauge';
import type { WScoreResult } from '@/lib/wouaka-products/types';

// ============================================
// TYPES
// ============================================

interface ProofCertificate {
  proof_type: 'phone_ownership' | 'identity_match' | 'sms_analysis' | 'document_verification' | 'aml_screening';
  status: 'verified' | 'partial' | 'pending' | 'failed';
  confidence: number;
  verified_at?: string;
  source_details: Record<string, unknown>;
  certainty_coefficient: number;
}

interface CashflowAnalysis {
  total_income: number;
  total_expenses: number;
  net_flow: number;
  income_regularity: number;
  transaction_count: number;
  period_days: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  anomalies: string[];
}

interface AMLScreeningResult {
  screening_status: 'clear' | 'match' | 'pending_review';
  pep_detected: boolean;
  pep_category?: string;
  sanction_matches: number;
  risk_level: 'low' | 'medium' | 'high';
  last_screened_at: string;
}

interface ProofDossierData {
  client_id: string;
  client_name: string;
  phone_number: string;
  evaluation_date: string;
  
  // Core Score
  score_result: WScoreResult;
  certainty_analysis: {
    overall_certainty: number;
    raw_score: number;
    certified_score: number;
    source_breakdown: Array<{ source: string; count: number; avg_certainty: number }>;
  };
  
  // Proof Certificates
  proof_certificates: ProofCertificate[];
  
  // Cashflow Analysis
  cashflow_analysis: CashflowAnalysis | null;
  
  // AML/PEP Screening
  aml_screening: AMLScreeningResult | null;
  
  // Audit Trail
  audit_events: Array<{
    event_type: string;
    timestamp: string;
    details: string;
    source_table: string;
    source_id: string;
  }>;
}

interface ProofDossierProps {
  data: ProofDossierData;
  onExportPDF?: () => void;
  onRequestUpdate?: () => void;
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ProofCertificateCard({ certificate }: { certificate: ProofCertificate }) {
  const statusConfig = {
    verified: { color: 'bg-green-500', icon: CheckCircle2, label: 'Vérifié' },
    partial: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Partiel' },
    pending: { color: 'bg-blue-500', icon: Clock, label: 'En attente' },
    failed: { color: 'bg-red-500', icon: XCircle, label: 'Échoué' },
  };
  
  const typeLabels: Record<string, { label: string; icon: React.ElementType }> = {
    phone_ownership: { label: 'Propriété du numéro', icon: Phone },
    identity_match: { label: 'Correspondance identité', icon: Fingerprint },
    sms_analysis: { label: 'Analyse SMS', icon: MessageSquare },
    document_verification: { label: 'Vérification documents', icon: FileText },
    aml_screening: { label: 'Screening AML/PEP', icon: Shield },
  };
  
  const config = statusConfig[certificate.status];
  const typeConfig = typeLabels[certificate.proof_type] || { label: certificate.proof_type, icon: Info };
  const StatusIcon = config.icon;
  const TypeIcon = typeConfig.icon;
  
  return (
    <div className={`
      p-4 rounded-lg border transition-all
      ${certificate.status === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-950/30' : 
        certificate.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-950/30' : 
        'bg-muted/30'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${certificate.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-muted'}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">{typeConfig.label}</div>
            <div className="text-sm text-muted-foreground">
              Coefficient : {Math.round(certificate.certainty_coefficient * 100)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>
      
      <div className="mt-3">
        <Progress value={certificate.confidence * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Confiance : {Math.round(certificate.confidence * 100)}%</span>
          {certificate.verified_at && (
            <span>Vérifié le {new Date(certificate.verified_at).toLocaleDateString('fr-FR')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CashflowCard({ analysis }: { analysis: CashflowAnalysis }) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  
  const TrendIcon = analysis.trend === 'increasing' ? TrendingUp : 
                    analysis.trend === 'decreasing' ? TrendingDown : 
                    TrendingUp;
  const trendColor = analysis.trend === 'increasing' ? 'text-green-600' : 
                     analysis.trend === 'decreasing' ? 'text-red-600' : 
                     'text-blue-600';
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Analyse des Flux
        </CardTitle>
        <CardDescription>
          Période : {analysis.period_days} jours ({analysis.transaction_count} transactions)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-950/30">
            <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <div className="text-lg font-bold text-green-600">{formatCurrency(analysis.total_income)}</div>
            <div className="text-xs text-muted-foreground">Revenus</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg dark:bg-red-950/30">
            <TrendingDown className="w-5 h-5 mx-auto text-red-600 mb-1" />
            <div className="text-lg font-bold text-red-600">{formatCurrency(analysis.total_expenses)}</div>
            <div className="text-xs text-muted-foreground">Dépenses</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${analysis.net_flow >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <Wallet className={`w-5 h-5 mx-auto mb-1 ${analysis.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div className={`text-lg font-bold ${analysis.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(analysis.net_flow)}
            </div>
            <div className="text-xs text-muted-foreground">Flux Net</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            <span className="text-sm">Tendance des revenus</span>
          </div>
          <Badge className={trendColor}>
            {analysis.trend === 'increasing' ? 'En hausse' : 
             analysis.trend === 'decreasing' ? 'En baisse' : 'Stable'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm">Régularité des revenus</span>
          <div className="flex items-center gap-2">
            <Progress value={analysis.income_regularity * 100} className="w-24 h-2" />
            <span className="text-sm font-medium">{Math.round(analysis.income_regularity * 100)}%</span>
          </div>
        </div>
        
        {analysis.anomalies.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Anomalies détectées</span>
            </div>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {analysis.anomalies.map((anomaly, i) => (
                <li key={i}>• {anomaly}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AMLScreeningCard({ screening }: { screening: AMLScreeningResult }) {
  const statusConfig = {
    clear: { color: 'bg-green-500', label: 'Aucune correspondance' },
    match: { color: 'bg-red-500', label: 'Correspondances trouvées' },
    pending_review: { color: 'bg-yellow-500', label: 'En cours de revue' },
  };
  
  const riskConfig = {
    low: { color: 'text-green-600 bg-green-100', label: 'Faible' },
    medium: { color: 'text-yellow-600 bg-yellow-100', label: 'Moyen' },
    high: { color: 'text-red-600 bg-red-100', label: 'Élevé' },
  };
  
  const config = statusConfig[screening.screening_status];
  const risk = riskConfig[screening.risk_level];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Screening AML/PEP
        </CardTitle>
        <CardDescription>
          Dernière vérification : {new Date(screening.last_screened_at).toLocaleDateString('fr-FR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span>Statut du screening</span>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span>Niveau de risque</span>
          <Badge className={risk.color}>{risk.label}</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span>Personne Politiquement Exposée (PEP)</span>
          <div className="flex items-center gap-2">
            {screening.pep_detected ? (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <Badge variant="destructive">{screening.pep_category || 'Oui'}</Badge>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <Badge className="bg-green-500">Non</Badge>
              </>
            )}
          </div>
        </div>
        
        {screening.sanction_matches > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-200">
                {screening.sanction_matches} correspondance(s) dans les listes de sanctions
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProofDossier({ data, onExportPDF, onRequestUpdate }: ProofDossierProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const verifiedProofs = data.proof_certificates.filter(p => p.status === 'verified').length;
  const totalProofs = data.proof_certificates.length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>{data.client_name}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {data.phone_number}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Évalué le {new Date(data.evaluation_date).toLocaleDateString('fr-FR')}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  Exporter PDF
                </Button>
              )}
              {onRequestUpdate && (
                <Button size="sm" onClick={onRequestUpdate}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Demander mise à jour
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Score Display */}
            <div className="text-center">
              <ScoreGauge 
                score={data.score_result.final_score} 
                riskCategory={data.score_result.risk_tier}
                confidence={data.score_result.confidence}
              />
              <div className="mt-2">
                <Badge className={`text-lg px-4 py-1 ${
                  data.score_result.fraud_analysis.risk_level === 'low' ? 'bg-green-500' :
                  data.score_result.fraud_analysis.risk_level === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  Grade {data.score_result.grade}
                </Badge>
              </div>
            </div>
            
            {/* Certainty Analysis */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Coefficient de Certitude
              </h4>
              <div className="text-3xl font-bold text-primary">
                {Math.round(data.certainty_analysis.overall_certainty * 100)}%
              </div>
              <Progress value={data.certainty_analysis.overall_certainty * 100} className="h-3" />
              <div className="text-sm text-muted-foreground">
                Score brut : {data.certainty_analysis.raw_score} → 
                Score certifié : {data.certainty_analysis.certified_score}
              </div>
            </div>
            
            {/* Proof Summary */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Preuves Validées
              </h4>
              <div className="text-3xl font-bold">
                {verifiedProofs}/{totalProofs}
              </div>
              <Progress value={(verifiedProofs / totalProofs) * 100} className="h-3" />
              <div className="flex flex-wrap gap-1">
                {data.proof_certificates.map((cert, i) => (
                  <Badge 
                    key={i}
                    variant={cert.status === 'verified' ? 'default' : 'outline'}
                    className={cert.status === 'verified' ? 'bg-green-500' : ''}
                  >
                    {cert.proof_type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Certificats</TabsTrigger>
          <TabsTrigger value="cashflow">Flux Financiers</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {data.proof_certificates.map((cert, i) => (
              <ProofCertificateCard key={i} certificate={cert} />
            ))}
          </div>
          
          {/* Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition des Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.certainty_analysis.source_breakdown.map((source, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{source.source}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {source.count} point(s) de données
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.avg_certainty * 100} className="w-24 h-2" />
                      <span className="text-sm font-medium">
                        {Math.round(source.avg_certainty * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflow" className="mt-4">
          {data.cashflow_analysis ? (
            <CashflowCard analysis={data.cashflow_analysis} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée de flux financier disponible.</p>
                <p className="text-sm mt-2">
                  Le client n'a pas autorisé l'analyse SMS ou aucune transaction n'a été détectée.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-4">
          {data.aml_screening ? (
            <AMLScreeningCard screening={data.aml_screening} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Screening AML/PEP non effectué.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des Événements</CardTitle>
              <CardDescription>
                Traçabilité complète des vérifications et sources de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.audit_events.length > 0 ? (
                  data.audit_events.map((event, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{event.event_type}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{event.details}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {event.source_table}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {event.source_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun événement d'audit enregistré.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
