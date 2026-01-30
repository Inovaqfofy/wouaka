import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  FileWarning,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
  Scale,
  Building2,
  Flag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Investigation {
  id: string;
  screening_id: string;
  kyc_request_id: string | null;
  status: 'pending' | 'in_progress' | 'cleared' | 'confirmed_match' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  decision: string | null;
  decision_reason: string | null;
  document_image_url: string | null;
  comparison_notes: string | null;
  created_at: string;
  updated_at: string;
  screening?: {
    full_name_hash: string;
    screening_status: string;
    match_score: number;
    match_type: string[];
    matches: any[];
    pep_detected: boolean;
    pep_category: string;
  };
}

interface ScreeningStats {
  total: number;
  pending: number;
  cleared: number;
  confirmed: number;
  pep_detected: number;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  in_progress: Eye,
  cleared: ShieldCheck,
  confirmed_match: ShieldAlert,
  escalated: AlertTriangle
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  cleared: "Blanchi",
  confirmed_match: "Match confirmé",
  escalated: "Escaladé"
};

const AMLInvestigations = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [stats, setStats] = useState<ScreeningStats>({ total: 0, pending: 0, cleared: 0, confirmed: 0, pep_detected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [comparisonNotes, setComparisonNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch investigations with screening data
      const { data: investigationsData, error: invError } = await supabase
        .from('aml_investigations')
        .select(`
          *,
          screening:aml_screenings(
            full_name_hash,
            screening_status,
            match_score,
            match_type,
            matches,
            pep_detected,
            pep_category
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (invError) throw invError;
      setInvestigations((investigationsData || []) as Investigation[]);

      // Fetch stats
      const { data: screenings } = await supabase
        .from('aml_screenings')
        .select('screening_status, pep_detected');

      if (screenings) {
        setStats({
          total: screenings.length,
          pending: screenings.filter(s => s.screening_status === 'potential_match').length,
          cleared: screenings.filter(s => s.screening_status === 'clear').length,
          confirmed: screenings.filter(s => s.screening_status === 'confirmed_match').length,
          pep_detected: screenings.filter(s => s.pep_detected).length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenInvestigation = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setDecision("");
    setDecisionReason("");
    setComparisonNotes(investigation.comparison_notes || "");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedInvestigation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: newStatus,
        comparison_notes: comparisonNotes
      };

      if (newStatus === 'in_progress' && selectedInvestigation.status === 'pending') {
        updateData.assigned_to = user?.id;
        updateData.assigned_at = new Date().toISOString();
      }

      if (['cleared', 'confirmed_match', 'escalated'].includes(newStatus)) {
        updateData.decision = decision;
        updateData.decision_reason = decisionReason;
        updateData.decided_by = user?.id;
        updateData.decided_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('aml_investigations')
        .update(updateData)
        .eq('id', selectedInvestigation.id);

      if (error) throw error;

      // Log the decision for compliance
      await supabase.from('compliance_logs').insert({
        log_type: 'decision',
        subject_hash: selectedInvestigation.screening?.full_name_hash || 'unknown',
        result_code: newStatus,
        risk_level: newStatus === 'confirmed_match' ? 'critical' : 
                   newStatus === 'escalated' ? 'high' : 'low',
        performed_by: user?.id,
        processing_reference: selectedInvestigation.id
      });

      toast.success('Investigation mise à jour');
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating investigation:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const pendingInvestigations = investigations.filter(i => i.status === 'pending');
  const inProgressInvestigations = investigations.filter(i => i.status === 'in_progress');
  const completedInvestigations = investigations.filter(i => 
    ['cleared', 'confirmed_match', 'escalated'].includes(i.status)
  );

  return (
    <DashboardLayout role="admin" title="Investigations LBC/FT">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : 
                    <p className="text-2xl font-bold">{stats.total}</p>
                  }
                  <p className="text-sm text-muted-foreground">Total screenings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : 
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  }
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : 
                    <p className="text-2xl font-bold text-green-600">{stats.cleared}</p>
                  }
                  <p className="text-sm text-muted-foreground">Blanchis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : 
                    <p className="text-2xl font-bold text-red-600">{stats.confirmed}</p>
                  }
                  <p className="text-sm text-muted-foreground">Confirmés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : 
                    <p className="text-2xl font-bold text-purple-600">{stats.pep_detected}</p>
                  }
                  <p className="text-sm text-muted-foreground">PEP détectés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investigations Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              En attente ({pendingInvestigations.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2">
              <Eye className="h-4 w-4" />
              En cours ({inProgressInvestigations.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Terminées ({completedInvestigations.length})
            </TabsTrigger>
          </TabsList>

          {['pending', 'in_progress', 'completed'].map((tab) => {
            const tabData = tab === 'pending' ? pendingInvestigations :
                           tab === 'in_progress' ? inProgressInvestigations :
                           completedInvestigations;

            return (
              <TabsContent key={tab} value={tab}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {tab === 'pending' ? 'Investigations en attente' :
                       tab === 'in_progress' ? 'Investigations en cours' :
                       'Investigations terminées'}
                    </CardTitle>
                    <CardDescription>
                      Cliquez sur une investigation pour voir les détails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : tabData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p>Aucune investigation {tab === 'pending' ? 'en attente' : 
                           tab === 'in_progress' ? 'en cours' : ''}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tabData.map((investigation) => {
                          const StatusIcon = statusIcons[investigation.status] || Clock;
                          const screening = investigation.screening;
                          
                          return (
                            <div
                              key={investigation.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleOpenInvestigation(investigation)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${
                                  investigation.priority === 'critical' ? 'bg-red-100' :
                                  investigation.priority === 'high' ? 'bg-orange-100' :
                                  'bg-yellow-100'
                                }`}>
                                  <StatusIcon className={`h-5 w-5 ${
                                    investigation.priority === 'critical' ? 'text-red-600' :
                                    investigation.priority === 'high' ? 'text-orange-600' :
                                    'text-yellow-600'
                                  }`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      Investigation #{investigation.id.slice(0, 8)}
                                    </span>
                                    <Badge className={priorityColors[investigation.priority]}>
                                      {investigation.priority.toUpperCase()}
                                    </Badge>
                                    {screening?.pep_detected && (
                                      <Badge variant="secondary" className="gap-1">
                                        <Flag className="h-3 w-3" />
                                        PEP
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Score: {screening?.match_score || 0}% • 
                                    Sources: {screening?.match_type?.join(', ') || 'N/A'} • 
                                    {format(new Date(investigation.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Examiner
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Investigation Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Détails de l'Investigation
              </DialogTitle>
              <DialogDescription>
                Comparez les informations et prenez une décision
              </DialogDescription>
            </DialogHeader>

            {selectedInvestigation && (
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-4">
                  <Badge className={priorityColors[selectedInvestigation.priority]}>
                    Priorité: {selectedInvestigation.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {statusLabels[selectedInvestigation.status]}
                  </Badge>
                  {selectedInvestigation.screening?.pep_detected && (
                    <Badge variant="destructive" className="gap-1">
                      <Flag className="h-3 w-3" />
                      PEP: {selectedInvestigation.screening.pep_category}
                    </Badge>
                  )}
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Document Image */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Document CNI Extrait
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedInvestigation.document_image_url ? (
                        <img 
                          src={selectedInvestigation.document_image_url} 
                          alt="Document CNI"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                          <FileWarning className="h-8 w-8 text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Image non disponible</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sanction Match Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        Correspondance Sanctions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedInvestigation.screening?.matches && 
                       selectedInvestigation.screening.matches.length > 0 ? (
                        <div className="space-y-3">
                          {selectedInvestigation.screening.matches.slice(0, 3).map((match: any, idx: number) => (
                            <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-red-800">{match.matched_name}</p>
                                  <p className="text-sm text-red-600">
                                    Source: {match.list_source} • Score: {match.match_score}%
                                  </p>
                                </div>
                                <Badge variant="destructive">{match.match_type}</Badge>
                              </div>
                              {match.reason && (
                                <p className="text-xs text-red-700 mt-2">{match.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          Aucune correspondance directe
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notes de comparaison
                  </label>
                  <Textarea
                    value={comparisonNotes}
                    onChange={(e) => setComparisonNotes(e.target.value)}
                    placeholder="Notez vos observations lors de la comparaison..."
                    rows={3}
                  />
                </div>

                {/* Decision Section */}
                {selectedInvestigation.status !== 'cleared' && 
                 selectedInvestigation.status !== 'confirmed_match' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium">Prendre une décision</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Décision</label>
                        <Select value={decision} onValueChange={setDecision}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une décision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false_positive">Faux positif - Blanchi</SelectItem>
                            <SelectItem value="confirmed_sanction">Match confirmé - Sanctionné</SelectItem>
                            <SelectItem value="escalate">Escalader au superviseur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Raison</label>
                        <Textarea
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Justifiez votre décision..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedInvestigation.decision && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Décision prise</h4>
                    <p className="text-green-700">{selectedInvestigation.decision}</p>
                    <p className="text-sm text-green-600 mt-1">{selectedInvestigation.decision_reason}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fermer
              </Button>
              
              {selectedInvestigation?.status === 'pending' && (
                <Button onClick={() => handleUpdateStatus('in_progress')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Commencer l'examen
                </Button>
              )}
              
              {selectedInvestigation?.status === 'in_progress' && decision && (
                <>
                  {decision === 'false_positive' && (
                    <Button variant="default" onClick={() => handleUpdateStatus('cleared')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Blanchir
                    </Button>
                  )}
                  {decision === 'confirmed_sanction' && (
                    <Button variant="destructive" onClick={() => handleUpdateStatus('confirmed_match')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Confirmer Match
                    </Button>
                  )}
                  {decision === 'escalate' && (
                    <Button variant="secondary" onClick={() => handleUpdateStatus('escalated')}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalader
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AMLInvestigations;
