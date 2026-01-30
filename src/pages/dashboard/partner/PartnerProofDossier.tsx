/**
 * PARTNER PROOF DOSSIER PAGE
 * Vue complète du dossier de preuves pour une évaluation
 * Affiche le certificat de propriété, l'analyse SMS, et le screening
 */

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  FileCheck,
  Shield,
  Phone,
  Fingerprint,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MessageSquare,
  Camera,
  Wallet,
  Users,
} from "lucide-react";

const PartnerProofDossier = () => {
  const { evaluationId } = useParams();

  // Fetch all related data for proof dossier
  const { data: evaluation, isLoading: isLoadingEval } = useQuery({
    queryKey: ['proof-dossier-eval', evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_requests')
        .select(`
          *,
          customer_profiles (
            id,
            external_reference,
            identity_data,
            data_sources,
            composite_score,
            reliability_score,
            stability_score,
            risk_score
          )
        `)
        .eq('id', evaluationId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!evaluationId,
  });

  // Fetch phone trust data
  const { data: phoneTrust, isLoading: isLoadingPhone } = useQuery({
    queryKey: ['proof-dossier-phone', evaluation?.phone_number],
    queryFn: async () => {
      if (!evaluation?.phone_number) return null;
      const { data, error } = await supabase
        .from('phone_trust_scores')
        .select('*')
        .eq('phone_number', evaluation.phone_number)
        .maybeSingle();
      return data;
    },
    enabled: !!evaluation?.phone_number,
  });

  // Fetch data enrichments
  const { data: enrichments, isLoading: isLoadingEnrich } = useQuery({
    queryKey: ['proof-dossier-enrichments', evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_enrichments')
        .select('*')
        .eq('scoring_request_id', evaluationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!evaluationId,
  });

  // Fetch AML screening
  const { data: amlScreening } = useQuery({
    queryKey: ['proof-dossier-aml', evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aml_screenings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!evaluationId,
  });

  const isLoading = isLoadingEval || isLoadingPhone || isLoadingEnrich;

  const getPhoneOwnershipLevel = () => {
    if (!phoneTrust) return { level: 'non_vérifié', color: 'bg-gray-100 text-gray-800' };
    if (phoneTrust.otp_verified && phoneTrust.identity_cross_validated) {
      return { level: 'certifié', color: 'bg-green-100 text-green-800' };
    }
    if (phoneTrust.otp_verified) {
      return { level: 'vérifié', color: 'bg-blue-100 text-blue-800' };
    }
    if (phoneTrust.ussd_screenshot_uploaded) {
      return { level: 'partiel', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { level: 'faible', color: 'bg-red-100 text-red-800' };
  };

  const ownershipInfo = getPhoneOwnershipLevel();

  // Calculate data certainty
  const dataSources = enrichments?.map(e => e.source_type) || [];
  const uniqueSources = [...new Set(dataSources)];
  const certaintyScore = Math.min(100, uniqueSources.length * 20 + (phoneTrust?.otp_verified ? 20 : 0));

  return (
    <DashboardLayout role="partner" title="Dossier de Preuves">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link to="/dashboard/partner/evaluations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux évaluations
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !evaluation ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dossier non trouvé</h3>
              <p className="text-muted-foreground">
                Cette évaluation n'existe pas ou vous n'y avez pas accès.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileCheck className="w-8 h-8 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold">Dossier de Preuves</h2>
                        <p className="text-muted-foreground">
                          Client: {evaluation.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className={ownershipInfo.color}>
                        <Fingerprint className="w-3 h-3 mr-1" />
                        Propriété: {ownershipInfo.level}
                      </Badge>
                      <Badge variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        {uniqueSources.length} source(s) vérifiée(s)
                      </Badge>
                      <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                        {evaluation.status === 'completed' ? (
                          <><CheckCircle className="w-3 h-3 mr-1" />Complet</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" />En cours</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Certitude globale</p>
                    <div className="flex items-center gap-2">
                      <Progress value={certaintyScore} className="w-32 h-3" />
                      <span className="text-2xl font-bold">{certaintyScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proof Tabs */}
            <Tabs defaultValue="ownership" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="ownership" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  <span className="hidden sm:inline">Propriété</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Financier</span>
                </TabsTrigger>
                <TabsTrigger value="screening" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Screening</span>
                </TabsTrigger>
                <TabsTrigger value="score" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Score</span>
                </TabsTrigger>
              </TabsList>

              {/* Phone Ownership Proof */}
              <TabsContent value="ownership">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-primary" />
                      Certificat de Propriété du Numéro
                    </CardTitle>
                    <CardDescription>
                      Validation que le numéro Mobile Money appartient bien au demandeur
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Phone Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="font-medium">Numéro vérifié</span>
                        </div>
                        <p className="text-xl font-mono">{evaluation.phone_number || '-'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">Ancienneté SIM</span>
                        </div>
                        <p className="text-xl">{phoneTrust?.phone_age_months || '-'} mois</p>
                      </div>
                    </div>

                    {/* Verification Steps */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Étapes de vérification</h4>
                      
                      <div className={`p-4 rounded-lg border flex items-center justify-between ${
                        phoneTrust?.otp_verified ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <MessageSquare className={`w-5 h-5 ${phoneTrust?.otp_verified ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">Vérification OTP</p>
                            <p className="text-sm text-muted-foreground">Code SMS reçu et validé</p>
                          </div>
                        </div>
                        {phoneTrust?.otp_verified ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Badge variant="outline">Non vérifié</Badge>
                        )}
                      </div>

                      <div className={`p-4 rounded-lg border flex items-center justify-between ${
                        phoneTrust?.ussd_screenshot_uploaded ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Camera className={`w-5 h-5 ${phoneTrust?.ussd_screenshot_uploaded ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">Capture USSD analysée</p>
                            <p className="text-sm text-muted-foreground">
                              Confiance OCR: {phoneTrust?.ussd_verification_confidence || 0}%
                            </p>
                          </div>
                        </div>
                        {phoneTrust?.ussd_screenshot_uploaded ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Badge variant="outline">Non fourni</Badge>
                        )}
                      </div>

                      <div className={`p-4 rounded-lg border flex items-center justify-between ${
                        phoneTrust?.identity_cross_validated ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Users className={`w-5 h-5 ${phoneTrust?.identity_cross_validated ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">Cross-validation identité</p>
                            <p className="text-sm text-muted-foreground">
                              Correspondance: {phoneTrust?.identity_match_score || 0}%
                            </p>
                          </div>
                        </div>
                        {phoneTrust?.identity_cross_validated ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Badge variant="outline">Non validé</Badge>
                        )}
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Score de Confiance Téléphone</p>
                          <p className="text-sm text-muted-foreground">
                            Calculé à partir des preuves fournies
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">
                            {phoneTrust?.trust_score || 0}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Analysis */}
              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Analyse des Flux Financiers
                    </CardTitle>
                    <CardDescription>
                      Données extraites des SMS et documents fournis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {enrichments && enrichments.length > 0 ? (
                      <div className="space-y-4">
                        {enrichments.map((enrichment, idx) => (
                          <div 
                            key={enrichment.id}
                            className="p-4 rounded-lg border bg-muted/30"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{enrichment.source_type}</Badge>
                                <Badge 
                                  variant={enrichment.verification_status === 'verified' ? 'default' : 'secondary'}
                                >
                                  {enrichment.verification_status}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Confiance: {enrichment.confidence_score || 0}%
                              </span>
                            </div>
                            
                            {enrichment.normalized_data && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {Object.entries(enrichment.normalized_data as Record<string, unknown>)
                                  .filter(([_, v]) => v !== null && v !== undefined)
                                  .slice(0, 8)
                                  .map(([key, value]) => (
                                    <div key={key} className="p-2 bg-background rounded">
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                      </p>
                                      <p className="font-medium truncate">
                                        {typeof value === 'number' 
                                          ? new Intl.NumberFormat('fr-FR').format(value)
                                          : String(value)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Aucune donnée d'enrichissement disponible</p>
                        <p className="text-sm">Le client n'a pas autorisé l'analyse de ses SMS</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AML Screening */}
              <TabsContent value="screening">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Résultats du Screening
                    </CardTitle>
                    <CardDescription>
                      Vérifications sanctions et PEP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {amlScreening ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg border ${
                          amlScreening.screening_status === 'clear' 
                            ? 'bg-green-50 border-green-200'
                            : amlScreening.screening_status === 'potential_match'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            {amlScreening.screening_status === 'clear' ? (
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-8 h-8 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-semibold text-lg">
                                {amlScreening.screening_status === 'clear' 
                                  ? 'Aucune correspondance' 
                                  : 'Correspondance potentielle'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Score de correspondance: {amlScreening.match_score || 0}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {amlScreening.pep_detected && (
                          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              <span className="font-medium">Personne Politiquement Exposée</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Catégorie: {amlScreening.pep_category || 'Non spécifiée'}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Screening non effectué</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Score Detail */}
              <TabsContent value="score">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Score de Solvabilité
                    </CardTitle>
                    <CardDescription>
                      Score de crédit calculé et détails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
                        <p className="text-5xl font-bold text-primary">
                          {evaluation.score || '--'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Score Final</p>
                        <Badge className="mt-2">Grade {evaluation.grade || 'N/A'}</Badge>
                      </div>
                      <div className="p-6 rounded-lg bg-muted/50 border text-center">
                        <p className="text-3xl font-bold">
                          {evaluation.confidence || '--'}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Confiance</p>
                      </div>
                      <div className="p-6 rounded-lg bg-muted/50 border text-center">
                        <p className="text-3xl font-bold capitalize">
                          {evaluation.risk_category?.replace('_', ' ') || '--'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Niveau de risque</p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="font-medium">Sources de données utilisées</h4>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSources.map((source) => (
                          <Badge key={source} variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {source}
                          </Badge>
                        ))}
                        {uniqueSources.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Aucune source vérifiée disponible
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Coefficient de certitude global</p>
                          <p className="text-sm text-muted-foreground">
                            Basé sur les preuves tangibles fournies
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{certaintyScore}%</p>
                        </div>
                      </div>
                      <Progress value={certaintyScore} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerProofDossier;
