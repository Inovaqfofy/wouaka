import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeft,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  User,
  Phone,
  CreditCard,
  Shield,
  FileText,
  Eye,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Calendar,
  Fingerprint,
  Camera,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";

interface VerificationItem {
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  confidence?: number;
  details?: string;
}

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score_impact?: number;
}

interface RiskFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

const PartnerKycDetail = () => {
  const { kycId } = useParams();

  // Fetch KYC request details
  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc-detail', kycId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_requests')
        .select(`
          *,
          customer_profiles (
            id,
            external_reference,
            identity_data
          )
        `)
        .eq('id', kycId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!kycId,
  });

  // Fetch associated documents
  const { data: documents } = useQuery({
    queryKey: ['kyc-documents', kycId, kyc?.partner_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!kycId && !!kyc,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Validé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">En cours d'examen</Badge>;
      case 'documents_required':
        return <Badge className="bg-orange-100 text-orange-800"><FileText className="w-3 h-3 mr-1" />Documents requis</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk: string | null) => {
    if (!risk) return null;
    switch (risk.toLowerCase()) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Risque faible</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Risque moyen</Badge>;
      case 'high':
        return <Badge variant="destructive">Risque élevé</Badge>;
      case 'critical':
        return <Badge className="bg-red-600 text-white">Risque critique</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Parse verifications_performed JSONB
  const verifications: VerificationItem[] = kyc?.verifications_performed 
    ? (Array.isArray(kyc.verifications_performed) 
        ? (kyc.verifications_performed as unknown as VerificationItem[])
        : Object.entries(kyc.verifications_performed as Record<string, unknown>).map(([name, data]) => ({
            name,
            status: 'pending' as const,
            ...(typeof data === 'object' && data !== null ? data as object : {})
          })) as VerificationItem[])
    : [];

  // Parse fraud_indicators JSONB
  const fraudIndicators: FraudIndicator[] = kyc?.fraud_indicators 
    ? (Array.isArray(kyc.fraud_indicators) ? kyc.fraud_indicators as unknown as FraudIndicator[] : [])
    : [];

  // Parse risk_flags - can be string array or object array
  const riskFlags: RiskFlag[] = kyc?.risk_flags 
    ? kyc.risk_flags.map((flag: string) => ({ flag, severity: 'medium' as const, description: '' }))
    : [];

  // Calculate identity score breakdown
  const identityBreakdown = [
    { name: "Vérification Document", value: kyc?.documents_verified ? 30 : 0, max: 30 },
    { name: "Format CNI Valide", value: kyc?.national_id ? 20 : 0, max: 20 },
    { name: "Correspondance Nom", value: kyc?.full_name ? 20 : 0, max: 20 },
    { name: "Vérification Téléphone", value: kyc?.phone_number ? 15 : 0, max: 15 },
    { name: "Données Cohérentes", value: kyc?.fraud_score && kyc.fraud_score < 30 ? 15 : 0, max: 15 },
  ];

  const kycLevel = kyc?.kyc_level || 'basic';
  const documentsRequired = kyc?.documents_required || [];

  return (
    <DashboardLayout role="partner" title="Détail KYC">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link to="/dashboard/partner/kyc">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux KYC
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
        ) : !kyc ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">KYC non trouvé</h3>
              <p className="text-muted-foreground">
                Cette demande KYC n'existe pas ou vous n'y avez pas accès.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{kyc.full_name}</h2>
                      <p className="text-muted-foreground">
                        {format(new Date(kyc.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getStatusBadge(kyc.status)}
                        {getRiskBadge(kyc.risk_level)}
                        <Badge variant="outline" className="capitalize">
                          KYC {kycLevel}
                        </Badge>
                        {kyc.processing_time_ms && (
                          <Badge variant="outline">
                            {kyc.processing_time_ms}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Score Identité</p>
                    <p className={`text-5xl font-bold ${getScoreColor(kyc.identity_score)}`}>
                      {kyc.identity_score || '--'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">/ 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Fingerprint className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${getScoreColor(kyc.identity_score)}`}>
                        {kyc.identity_score || '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">Score Identité</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${kyc.fraud_score && kyc.fraud_score > 30 ? 'bg-red-100' : 'bg-green-100'}`}>
                      <ShieldAlert className={`w-5 h-5 ${kyc.fraud_score && kyc.fraud_score > 30 ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${kyc.fraud_score && kyc.fraud_score > 30 ? 'text-red-600' : 'text-green-600'}`}>
                        {kyc.fraud_score ?? '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">Score Fraude</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {kyc.documents_verified || 0}/{kyc.documents_submitted || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Documents Vérifiés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {kyc.processing_time_ms ? `${(kyc.processing_time_ms / 1000).toFixed(1)}s` : '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">Temps traitement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Identity Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Décomposition du Score d'Identité
                </CardTitle>
                <CardDescription>
                  Détail des éléments contribuant au score d'identité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {identityBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className={`text-sm font-semibold ${item.value > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {item.value} / {item.max} pts
                        </span>
                      </div>
                      <Progress 
                        value={(item.value / item.max) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className={`text-lg font-bold ${getScoreColor(kyc.identity_score)}`}>
                        {kyc.identity_score || identityBreakdown.reduce((sum, item) => sum + item.value, 0)} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verifications Performed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  Vérifications Effectuées
                </CardTitle>
                <CardDescription>
                  Liste des contrôles réalisés lors de la vérification KYC
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verifications.length > 0 ? (
                  <div className="space-y-3">
                    {verifications.map((verification, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getVerificationIcon(verification.status)}
                          <div>
                            <p className="font-medium capitalize">{verification.name.replace(/_/g, ' ')}</p>
                            {verification.details && (
                              <p className="text-sm text-muted-foreground">{verification.details}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {verification.confidence !== undefined && (
                            <div className="text-right">
                              <p className="text-sm font-medium">{verification.confidence}%</p>
                              <p className="text-xs text-muted-foreground">confiance</p>
                            </div>
                          )}
                          <Badge variant={
                            verification.status === 'passed' ? 'default' :
                            verification.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {verification.status === 'passed' ? 'Réussi' :
                             verification.status === 'failed' ? 'Échec' :
                             verification.status === 'pending' ? 'En attente' : 'Non vérifié'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune vérification détaillée disponible</p>
                    <p className="text-sm mt-1">Les vérifications seront affichées ici après traitement</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations du Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nom complet</p>
                      <p className="font-medium">{kyc.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{kyc.phone_number || '--'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">N° CNI / Passeport</p>
                      <p className="font-medium">{kyc.national_id || '--'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Indicators */}
            {fraudIndicators.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <ShieldAlert className="w-5 h-5" />
                    Indicateurs de Fraude Détectés
                  </CardTitle>
                  <CardDescription>
                    Anomalies et signaux d'alerte identifiés lors de l'analyse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fraudIndicators.map((indicator, index) => (
                      <div 
                        key={index}
                        className={`p-4 border rounded-lg ${getSeverityColor(indicator.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 mt-0.5" />
                            <div>
                              <p className="font-medium capitalize">{indicator.type.replace(/_/g, ' ')}</p>
                              <p className="text-sm mt-1">{indicator.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={getSeverityColor(indicator.severity)}>
                              {indicator.severity === 'low' ? 'Faible' :
                               indicator.severity === 'medium' ? 'Moyen' :
                               indicator.severity === 'high' ? 'Élevé' : 'Critique'}
                            </Badge>
                            {indicator.score_impact !== undefined && (
                              <p className="text-sm mt-1 flex items-center gap-1 justify-end">
                                <TrendingDown className="w-3 h-3" />
                                -{indicator.score_impact} pts
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Flags */}
            {riskFlags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    Facteurs de Risque
                  </CardTitle>
                  <CardDescription>
                    Points d'attention détectés lors de la vérification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {riskFlags.map((risk, index) => (
                      <Badge 
                        key={index} 
                        className={getSeverityColor(risk.severity)}
                      >
                        {risk.flag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {kyc.rejection_reason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Motif de Rejet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">{kyc.rejection_reason}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents Required */}
            {documentsRequired.length > 0 && kyc.status === 'documents_required' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <FileText className="w-5 h-5" />
                    Documents Requis
                  </CardTitle>
                  <CardDescription>
                    Documents nécessaires pour compléter la vérification KYC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {documentsRequired.map((doc, index) => (
                      <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents Soumis
                </CardTitle>
                <CardDescription>
                  {kyc.documents_submitted || 0} document(s) soumis, {kyc.documents_verified || 0} vérifié(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {doc.document_type === 'selfie' ? (
                              <Camera className="w-6 h-6 text-primary" />
                            ) : (
                              <FileText className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                              {doc.ocr_confidence && (
                                <>
                                  <span>•</span>
                                  <span>OCR: {doc.ocr_confidence}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            doc.status === 'verified' ? 'default' : 
                            doc.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {doc.status === 'verified' ? 'Vérifié' : 
                             doc.status === 'rejected' ? 'Rejeté' : 
                             doc.status === 'pending' ? 'En attente' : doc.status}
                          </Badge>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun document associé trouvé</p>
                    <p className="text-sm mt-1">Les documents uploadés apparaîtront ici</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {kyc.status === 'pending' || kyc.status === 'under_review' ? (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Valider
                    </Button>
                    <Button variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                ) : (
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Relancer la vérification
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger rapport
                </Button>
                {kyc.customer_profiles && (
                  <Button variant="outline" asChild>
                    <Link to={`/dashboard/partner/clients/${(kyc.customer_profiles as Record<string, unknown>).id}`}>
                      <User className="w-4 h-4 mr-2" />
                      Voir le client
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerKycDetail;
