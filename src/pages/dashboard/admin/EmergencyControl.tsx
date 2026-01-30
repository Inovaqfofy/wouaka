import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Power, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Unlock,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  FileSearch,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FeatureControl {
  id: string;
  feature_name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  emergency_message: string;
  last_toggled_at: string | null;
}

interface LockdownState {
  is_full_lockdown: boolean;
  is_read_only_mode: boolean;
  lockdown_message: string;
  lockdown_reason: string | null;
  locked_at: string | null;
  auto_triggered: boolean;
}

interface EmergencyAction {
  id: string;
  action_type: string;
  feature_name: string | null;
  auto_triggered: boolean;
  trigger_reason: string | null;
  created_at: string;
}

interface IntegrityCheckResult {
  passed: boolean;
  transactions_checked: number;
  anomalies_found: number;
  suspicious_entries: any[];
  checked_at: string;
}

const EmergencyControl = () => {
  const [features, setFeatures] = useState<FeatureControl[]>([]);
  const [lockdown, setLockdown] = useState<LockdownState | null>(null);
  const [recentActions, setRecentActions] = useState<EmergencyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState("");
  const [lockdownReason, setLockdownReason] = useState("");
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase.functions.invoke('kill-switch', {
        method: 'GET'
      });

      if (error) throw error;

      setFeatures(data.data.features || []);
      setLockdown(data.data.lockdown);
      setRecentActions(data.data.recent_actions || []);
      setGlobalMessage(data.data.lockdown?.lockdown_message || "");
    } catch (error) {
      console.error('Error fetching kill switch status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'état du système"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleFeature = async (feature: FeatureControl) => {
    setActionLoading(feature.feature_name);
    try {
      const { error } = await supabase.functions.invoke('kill-switch?action=toggle_feature', {
        body: {
          feature_name: feature.feature_name,
          is_active: !feature.is_active
        }
      });

      if (error) throw error;

      toast({
        title: feature.is_active ? "Service désactivé" : "Service activé",
        description: `${feature.display_name} a été ${feature.is_active ? 'désactivé' : 'réactivé'}`
      });

      await fetchStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier l'état du service"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const triggerFullLockdown = async (enable: boolean) => {
    setActionLoading('lockdown');
    try {
      const { error } = await supabase.functions.invoke('kill-switch?action=full_lockdown', {
        body: {
          enable,
          lockdown_message: globalMessage || "Maintenance de sécurité en cours. Les services reprendront sous peu.",
          lockdown_reason: lockdownReason || "Activation manuelle par administrateur"
        }
      });

      if (error) throw error;

      toast({
        title: enable ? "🚨 LOCKDOWN ACTIVÉ" : "✅ Lockdown désactivé",
        description: enable 
          ? "Tous les services externes ont été suspendus"
          : "Les services ont été rétablis",
        variant: enable ? "destructive" : "default"
      });

      await fetchStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'activer le lockdown"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleReadOnlyMode = async (enable: boolean) => {
    setActionLoading('readonly');
    try {
      const { error } = await supabase.functions.invoke('kill-switch?action=read_only_mode', {
        body: {
          enable,
          lockdown_message: globalMessage || "Mode lecture seule activé."
        }
      });

      if (error) throw error;

      toast({
        title: enable ? "Mode lecture seule activé" : "Mode normal rétabli",
        description: enable 
          ? "Aucune nouvelle donnée ne peut être traitée"
          : "Le traitement des données est rétabli"
      });

      await fetchStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de changer le mode"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const runIntegrityCheck = async () => {
    setCheckingIntegrity(true);
    try {
      const { data, error } = await supabase.functions.invoke('kill-switch?action=integrity_check', {
        body: { time_window_minutes: 10 }
      });

      if (error) throw error;

      setIntegrityResult(data.check_result);

      toast({
        title: data.check_result.passed ? "✅ Vérification réussie" : "⚠️ Anomalies détectées",
        description: data.check_result.passed 
          ? "Aucune anomalie détectée dans les 10 dernières minutes"
          : `${data.check_result.anomalies_found} anomalie(s) trouvée(s)`,
        variant: data.check_result.passed ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'exécuter la vérification d'intégrité"
      });
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'lockdown': return <Lock className="h-4 w-4 text-destructive" />;
      case 'unlock': return <Unlock className="h-4 w-4 text-green-500" />;
      case 'feature_disable': return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'feature_enable': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'integrity_check': return <FileSearch className="h-4 w-4 text-blue-500" />;
      case 'auto_read_only': return <Eye className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: EmergencyAction) => {
    const labels: Record<string, string> = {
      'lockdown': 'Full Lockdown activé',
      'unlock': 'Lockdown désactivé',
      'feature_disable': `${action.feature_name} désactivé`,
      'feature_enable': `${action.feature_name} activé`,
      'integrity_check': 'Vérification d\'intégrité',
      'auto_read_only': 'Mode lecture seule automatique',
      'read_only_enable': 'Mode lecture seule activé',
      'read_only_disable': 'Mode lecture seule désactivé'
    };
    return labels[action.action_type] || action.action_type;
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Urgence & Résilience">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const isSystemLocked = lockdown?.is_full_lockdown || lockdown?.is_read_only_mode;

  return (
    <DashboardLayout role="admin" title="Urgence & Résilience">
      <div className="space-y-6">
        {/* Status Banner */}
        {lockdown?.is_full_lockdown && (
          <Alert variant="destructive" className="border-destructive bg-destructive/10">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-bold">🚨 FULL LOCKDOWN ACTIF</AlertTitle>
            <AlertDescription>
              Tous les services externes sont suspendus. 
              {lockdown.auto_triggered && " (Déclenché automatiquement par Security Watch)"}
              <br />
              <span className="text-sm opacity-80">
                Activé le {lockdown.locked_at && format(new Date(lockdown.locked_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {lockdown?.is_read_only_mode && !lockdown?.is_full_lockdown && (
          <Alert className="border-yellow-500 bg-yellow-500/10">
            <Eye className="h-5 w-5 text-yellow-500" />
            <AlertTitle className="font-bold text-yellow-700">Mode Lecture Seule Actif</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Les utilisateurs peuvent consulter leurs données existantes, mais aucune nouvelle donnée ne peut être traitée.
              {lockdown.auto_triggered && " (Déclenché automatiquement)"}
            </AlertDescription>
          </Alert>
        )}

        {/* Red Button Section */}
        <Card className="border-destructive/50">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Power className="h-5 w-5" />
              Bouton d'Arrêt d'Urgence
            </CardTitle>
            <CardDescription>
              Contrôle immédiat de tous les services critiques de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Global Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message affiché aux utilisateurs</label>
              <Textarea
                value={globalMessage}
                onChange={(e) => setGlobalMessage(e.target.value)}
                placeholder="Maintenance de sécurité en cours. Les services reprendront sous peu."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Raison du lockdown (interne)</label>
              <Textarea
                value={lockdownReason}
                onChange={(e) => setLockdownReason(e.target.value)}
                placeholder="Ex: Détection d'intrusion, Attaque DDoS, Compromission potentielle..."
                className="min-h-[60px]"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Lockdown Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={lockdown?.is_full_lockdown ? "outline" : "destructive"}
                    size="lg"
                    className="w-full h-20 text-lg font-bold"
                    disabled={actionLoading === 'lockdown'}
                  >
                    {lockdown?.is_full_lockdown ? (
                      <>
                        <Unlock className="mr-2 h-6 w-6" />
                        Désactiver Lockdown
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-6 w-6" />
                        FULL LOCKDOWN
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      {lockdown?.is_full_lockdown 
                        ? "Désactiver le Lockdown ?"
                        : "Activer le Full Lockdown ?"
                      }
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {lockdown?.is_full_lockdown 
                        ? "Cette action réactivera tous les services. Assurez-vous d'avoir vérifié l'intégrité du système."
                        : "Cette action suspendra IMMÉDIATEMENT tous les services externes : API, KYC, Webhooks, Paiements. Les utilisateurs verront le message d'urgence."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => triggerFullLockdown(!lockdown?.is_full_lockdown)}
                      className={lockdown?.is_full_lockdown ? "" : "bg-destructive hover:bg-destructive/90"}
                    >
                      {lockdown?.is_full_lockdown ? "Désactiver" : "Confirmer le Lockdown"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Read-Only Mode Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={lockdown?.is_read_only_mode ? "outline" : "secondary"}
                    size="lg"
                    className="w-full h-20 text-lg font-bold"
                    disabled={actionLoading === 'readonly' || lockdown?.is_full_lockdown}
                  >
                    <Eye className="mr-2 h-6 w-6" />
                    {lockdown?.is_read_only_mode ? "Désactiver Lecture Seule" : "Mode Lecture Seule"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {lockdown?.is_read_only_mode 
                        ? "Désactiver le mode lecture seule ?"
                        : "Activer le mode lecture seule ?"
                      }
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {lockdown?.is_read_only_mode 
                        ? "Le traitement des nouvelles données sera rétabli."
                        : "Les utilisateurs pourront consulter leurs scores existants, mais aucune nouvelle évaluation ne sera possible."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toggleReadOnlyMode(!lockdown?.is_read_only_mode)}
                    >
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Integrity Check Button */}
              <Button 
                variant="outline"
                size="lg"
                className="w-full h-20 text-lg font-bold border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={runIntegrityCheck}
                disabled={checkingIntegrity}
              >
                {checkingIntegrity ? (
                  <>
                    <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <FileSearch className="mr-2 h-6 w-6" />
                    Vérifier Intégrité
                  </>
                )}
              </Button>
            </div>

            {/* Integrity Check Result */}
            {integrityResult && (
              <Alert className={integrityResult.passed ? "border-green-500 bg-green-50" : "border-destructive bg-destructive/10"}>
                {integrityResult.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <AlertTitle>
                  {integrityResult.passed ? "Système sain" : "Anomalies détectées"}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Transactions vérifiées: {integrityResult.transactions_checked}</p>
                    <p>Anomalies trouvées: {integrityResult.anomalies_found}</p>
                    {integrityResult.anomalies_found > 0 && (
                      <div className="mt-2 p-2 bg-background rounded text-xs">
                        <p className="font-medium">Entrées suspectes:</p>
                        <pre className="overflow-auto max-h-32">
                          {JSON.stringify(integrityResult.suspicious_entries, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Individual Feature Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Contrôle des Services Individuels
            </CardTitle>
            <CardDescription>
              Activez ou désactivez chaque service indépendamment avec double confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {features.map((feature) => (
                <div 
                  key={feature.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    !feature.is_active ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feature.display_name}</span>
                      <Badge variant={feature.is_active ? "default" : "destructive"}>
                        {feature.is_active ? "Actif" : "Désactivé"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                    {!feature.is_active && (
                      <p className="text-xs text-destructive mt-1">
                        Message: {feature.emergency_message}
                      </p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center">
                        <Switch
                          checked={feature.is_active}
                          disabled={actionLoading === feature.feature_name || lockdown?.is_full_lockdown}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {feature.is_active ? "Désactiver" : "Réactiver"} {feature.display_name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {feature.is_active 
                            ? `Les utilisateurs et partenaires verront le message: "${feature.emergency_message}"`
                            : "Le service sera remis en ligne immédiatement."
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => toggleFeature(feature)}
                          className={feature.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                          {feature.is_active ? "Désactiver" : "Réactiver"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des Actions d'Urgence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune action d'urgence enregistrée
                </p>
              ) : (
                recentActions.map((action) => (
                  <div 
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    {getActionIcon(action.action_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getActionLabel(action)}
                        </span>
                        {action.auto_triggered && (
                          <Badge variant="secondary" className="text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                      {action.trigger_reason && (
                        <p className="text-xs text-muted-foreground">
                          {action.trigger_reason}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(action.created_at), "dd/MM HH:mm", { locale: fr })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmergencyControl;