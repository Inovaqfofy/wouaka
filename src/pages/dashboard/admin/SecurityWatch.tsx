import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  AlertTriangle,
  Ban,
  Eye,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Globe,
  Bot,
  Fingerprint,
  Activity,
  TrendingUp,
  BarChart3,
  Unlock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// Types
interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  source_ip: string | null;
  user_agent: string | null;
  user_id: string | null;
  api_key_id: string | null;
  endpoint: string | null;
  payload: Record<string, unknown> | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  action_taken: string | null;
  created_at: string;
}

interface BlacklistedIP {
  id: string;
  ip_address: string;
  reason: string;
  banned_at: string;
  banned_until: string | null;
  banned_by: string | null;
  trigger_endpoint: string | null;
  trigger_details: Record<string, unknown> | null;
  is_active: boolean;
  unban_reason: string | null;
  unbanned_at: string | null;
}

interface FailedLoginAttempt {
  id: string;
  ip_address: string;
  email_hash: string | null;
  user_agent: string | null;
  failure_reason: string | null;
  attempt_count: number;
  first_attempt_at: string;
  last_attempt_at: string;
  is_blocked: boolean;
}

// Severity colors
const SEVERITY_COLORS = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

const ALERT_TYPE_ICONS: Record<string, typeof Shield> = {
  honeypot_triggered: Bot,
  velocity_breach: Activity,
  emulator_detected: Fingerprint,
  bot_detected: Bot,
  ddos_attempt: Globe,
};

const SecurityWatch = () => {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState("");
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [ipToUnban, setIpToUnban] = useState<BlacklistedIP | null>(null);
  const [unbanReason, setUnbanReason] = useState("");

  // Fetch security alerts
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as SecurityAlert[];
    }
  });

  // Fetch blacklisted IPs
  const { data: blacklistedIPs = [], isLoading: ipsLoading, refetch: refetchIPs } = useQuery({
    queryKey: ['blacklisted-ips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blacklisted_ips')
        .select('*')
        .order('banned_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as BlacklistedIP[];
    }
  });

  // Fetch failed login attempts
  const { data: failedLogins = [], isLoading: loginsLoading } = useQuery({
    queryKey: ['failed-login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('last_attempt_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as FailedLoginAttempt[];
    }
  });

  // Real-time subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel('security-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_alerts' },
        (payload) => {
          toast.error(`🚨 Nouvelle alerte de sécurité: ${(payload.new as SecurityAlert).alert_type}`, {
            duration: 10000,
          });
          queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('security_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
          notes,
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerte acquittée");
      setSelectedAlert(null);
      setAcknowledgeNotes("");
      refetchAlerts();
    },
    onError: () => {
      toast.error("Erreur lors de l'acquittement");
    }
  });

  // Unban IP mutation
  const unbanMutation = useMutation({
    mutationFn: async ({ ipId, reason }: { ipId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blacklisted_ips')
        .update({
          is_active: false,
          unban_reason: reason,
          unbanned_at: new Date().toISOString(),
          unbanned_by: user?.id,
        })
        .eq('id', ipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("IP débloquée");
      setUnbanDialogOpen(false);
      setIpToUnban(null);
      setUnbanReason("");
      refetchIPs();
    },
    onError: () => {
      toast.error("Erreur lors du déblocage");
    }
  });

  // Stats calculations
  const stats = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    unacknowledgedAlerts: alerts.filter(a => !a.is_acknowledged).length,
    activeBans: blacklistedIPs.filter(ip => ip.is_active).length,
    honeypotTriggers: alerts.filter(a => a.alert_type === 'honeypot_triggered').length,
    velocityBreaches: alerts.filter(a => a.alert_type === 'velocity_breach').length,
  };

  // Chart data
  const alertsByType = Object.entries(
    alerts.reduce((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const alertsBySeverity = [
    { name: 'Critique', value: alerts.filter(a => a.severity === 'critical').length, color: '#ef4444' },
    { name: 'Élevée', value: alerts.filter(a => a.severity === 'high').length, color: '#f97316' },
    { name: 'Moyenne', value: alerts.filter(a => a.severity === 'medium').length, color: '#eab308' },
    { name: 'Basse', value: alerts.filter(a => a.severity === 'low').length, color: '#3b82f6' },
  ];

  // Last 7 days trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAlerts = alerts.filter(a => a.created_at.startsWith(dateStr));
    return {
      date: format(date, 'dd/MM'),
      total: dayAlerts.length,
      critical: dayAlerts.filter(a => a.severity === 'critical').length,
    };
  });

  return (
    <DashboardLayout role="admin" title="Security Watch">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Security Watch
            </h1>
            <p className="text-muted-foreground mt-1">
              Surveillance des menaces et protection active
            </p>
          </div>
          <Button onClick={() => {
            refetchAlerts();
            refetchIPs();
          }} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertes totales</CardTitle>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unacknowledgedAlerts} non acquittées
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-500">Alertes critiques</CardTitle>
              <XCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Nécessitent une attention immédiate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">IPs bannies</CardTitle>
              <Ban className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBans}</div>
              <p className="text-xs text-muted-foreground">
                Actives actuellement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Honeypot</CardTitle>
              <Bot className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.honeypotTriggers}</div>
              <p className="text-xs text-muted-foreground">
                Déclenchements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendance sur 7 jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critiques" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Répartition par sévérité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alertsBySeverity}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {alertsBySeverity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts">
              Alertes
              {stats.unacknowledgedAlerts > 0 && (
                <Badge variant="destructive" className="ml-2">{stats.unacknowledgedAlerts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="banned">
              IPs bannies
              <Badge variant="secondary" className="ml-2">{stats.activeBans}</Badge>
            </TabsTrigger>
            <TabsTrigger value="failed-logins">
              Connexions échouées
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertes de sécurité</CardTitle>
                <CardDescription>
                  Activité suspecte détectée par le système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Sévérité</TableHead>
                        <TableHead>Source IP</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Chargement...
                          </TableCell>
                        </TableRow>
                      ) : alerts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                            Aucune alerte de sécurité
                          </TableCell>
                        </TableRow>
                      ) : (
                        alerts.map((alert) => {
                          const Icon = ALERT_TYPE_ICONS[alert.alert_type] || AlertTriangle;
                          return (
                            <TableRow key={alert.id} className={!alert.is_acknowledged ? 'bg-muted/30' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span className="font-medium">
                                    {alert.alert_type.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]}>
                                  {alert.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs">{alert.source_ip || '-'}</code>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs">{alert.endpoint || '-'}</code>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDistanceToNow(new Date(alert.created_at), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>
                                {alert.is_acknowledged ? (
                                  <Badge variant="outline" className="text-green-500">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Acquittée
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    En attente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAlert(alert)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banned IPs Tab */}
          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle>Adresses IP bannies</CardTitle>
                <CardDescription>
                  IPs bloquées automatiquement ou manuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adresse IP</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Bannissement</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Chargement...
                          </TableCell>
                        </TableRow>
                      ) : blacklistedIPs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                            Aucune IP bannie
                          </TableCell>
                        </TableRow>
                      ) : (
                        blacklistedIPs.map((ip) => (
                          <TableRow key={ip.id} className={ip.is_active ? 'bg-red-500/5' : 'opacity-50'}>
                            <TableCell>
                              <code className="text-sm font-mono">{ip.ip_address}</code>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{ip.reason}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(ip.banned_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {ip.banned_until ? (
                                <div className="text-sm">
                                  {format(new Date(ip.banned_until), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                </div>
                              ) : (
                                <Badge variant="destructive">Permanent</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {ip.is_active ? (
                                <Badge variant="destructive">Actif</Badge>
                              ) : (
                                <Badge variant="outline">Expiré</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {ip.is_active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIpToUnban(ip);
                                    setUnbanDialogOpen(true);
                                  }}
                                >
                                  <Unlock className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failed Logins Tab */}
          <TabsContent value="failed-logins">
            <Card>
              <CardHeader>
                <CardTitle>Tentatives de connexion échouées</CardTitle>
                <CardDescription>
                  Suivi des tentatives d'authentification infructueuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adresse IP</TableHead>
                        <TableHead>Tentatives</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Première tentative</TableHead>
                        <TableHead>Dernière tentative</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Chargement...
                          </TableCell>
                        </TableRow>
                      ) : failedLogins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                            Aucune tentative échouée
                          </TableCell>
                        </TableRow>
                      ) : (
                        failedLogins.map((login) => (
                          <TableRow key={login.id}>
                            <TableCell>
                              <code className="text-sm font-mono">{login.ip_address}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={login.attempt_count >= 5 ? "destructive" : "secondary"}>
                                {login.attempt_count}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{login.failure_reason || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(login.first_attempt_at), 'dd/MM HH:mm', { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDistanceToNow(new Date(login.last_attempt_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {login.is_blocked ? (
                                <Badge variant="destructive">Bloqué</Badge>
                              ) : (
                                <Badge variant="outline">Actif</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alert Detail Dialog */}
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'alerte</DialogTitle>
              <DialogDescription>
                {selectedAlert?.alert_type.replace(/_/g, ' ')} - {selectedAlert?.created_at && format(new Date(selectedAlert.created_at), 'dd/MM/yyyy HH:mm:ss')}
              </DialogDescription>
            </DialogHeader>
            
            {selectedAlert && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sévérité</p>
                    <Badge className={SEVERITY_COLORS[selectedAlert.severity as keyof typeof SEVERITY_COLORS]}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <span className="text-sm">{selectedAlert.action_taken || 'Aucune'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Source IP</p>
                    <code className="text-sm">{selectedAlert.source_ip || '-'}</code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                    <code className="text-sm">{selectedAlert.endpoint || '-'}</code>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                  <code className="text-xs break-all bg-muted p-2 rounded block">
                    {selectedAlert.user_agent || '-'}
                  </code>
                </div>

                {selectedAlert.payload && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Payload</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedAlert.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedAlert.is_acknowledged && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes (optionnel)</p>
                    <Textarea
                      value={acknowledgeNotes}
                      onChange={(e) => setAcknowledgeNotes(e.target.value)}
                      placeholder="Ajouter des notes sur cette alerte..."
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Fermer
              </Button>
              {selectedAlert && !selectedAlert.is_acknowledged && (
                <Button 
                  onClick={() => acknowledgeMutation.mutate({ 
                    alertId: selectedAlert.id, 
                    notes: acknowledgeNotes 
                  })}
                  disabled={acknowledgeMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acquitter l'alerte
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unban Dialog */}
        <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Débloquer l'adresse IP</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir débloquer {ipToUnban?.ip_address} ?
              </DialogDescription>
            </DialogHeader>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Raison du déblocage</p>
              <Textarea
                value={unbanReason}
                onChange={(e) => setUnbanReason(e.target.value)}
                placeholder="Expliquer pourquoi cette IP est débloquée..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUnbanDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => ipToUnban && unbanMutation.mutate({ 
                  ipId: ipToUnban.id, 
                  reason: unbanReason 
                })}
                disabled={unbanMutation.isPending || !unbanReason}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Débloquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SecurityWatch;