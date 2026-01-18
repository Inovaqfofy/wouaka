import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Clock,
  TrendingUp,
  Server,
  Database,
  Shield,
  Zap,
  Globe,
  Calendar
} from 'lucide-react';
import { SandboxNavbar, SandboxFooter } from '../components/layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { DeveloperSidebar } from '../components/developer';
import { getMainSiteUrl } from '../lib/sandbox-config';

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  latency: number;
  uptime: number;
  lastCheck: Date;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  updates: {
    timestamp: Date;
    message: string;
    status: string;
  }[];
}

interface UptimeDay {
  date: Date;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
}

const DeveloperStatus = () => {
  const [activeSection, setActiveSection] = useState('status');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulated services data
  const [services] = useState<ServiceStatus[]>([
    {
      id: 'api-scoring',
      name: 'API Scoring',
      description: 'Calcul des scores de crédit',
      status: 'operational',
      latency: 145,
      uptime: 99.98,
      lastCheck: new Date()
    },
    {
      id: 'api-kyc',
      name: 'API KYC',
      description: 'Vérification d\'identité',
      status: 'operational',
      latency: 234,
      uptime: 99.95,
      lastCheck: new Date()
    },
    {
      id: 'api-webhooks',
      name: 'Webhooks',
      description: 'Notifications en temps réel',
      status: 'operational',
      latency: 89,
      uptime: 99.99,
      lastCheck: new Date()
    },
    {
      id: 'database',
      name: 'Base de données',
      description: 'Stockage des données',
      status: 'operational',
      latency: 12,
      uptime: 99.99,
      lastCheck: new Date()
    },
    {
      id: 'auth',
      name: 'Authentification',
      description: 'OAuth2 / JWT',
      status: 'operational',
      latency: 56,
      uptime: 100,
      lastCheck: new Date()
    },
    {
      id: 'sandbox',
      name: 'Sandbox',
      description: 'Environnement de test',
      status: 'operational',
      latency: 178,
      uptime: 99.90,
      lastCheck: new Date()
    }
  ]);

  // Past incidents
  const [incidents] = useState<Incident[]>([
    {
      id: '1',
      title: 'Latence élevée sur l\'API Scoring',
      status: 'resolved',
      severity: 'minor',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      updates: [
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          message: 'Nous observons une latence élevée sur l\'API Scoring. Investigation en cours.',
          status: 'investigating'
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
          message: 'Le problème a été identifié comme une surcharge temporaire du cache.',
          status: 'identified'
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
          message: 'Le problème a été résolu. Performances revenues à la normale.',
          status: 'resolved'
        }
      ]
    }
  ]);

  // Generate 90 days of uptime history
  const uptimeHistory: UptimeDay[] = Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (89 - i));
    const random = Math.random();
    return {
      date,
      status: random > 0.02 ? 'operational' : random > 0.01 ? 'degraded' : 'outage',
      uptime: random > 0.02 ? 100 : random > 0.01 ? 99.5 : 98
    };
  });

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-blue-500';
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Opérationnel</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Dégradé</Badge>;
      case 'outage':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Panne</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Maintenance</Badge>;
    }
  };

  const getSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'minor':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Mineur</Badge>;
      case 'major':
        return <Badge variant="outline" className="text-orange-400 border-orange-400">Majeur</Badge>;
      case 'critical':
        return <Badge variant="outline" className="text-red-400 border-red-400">Critique</Badge>;
    }
  };

  const getIncidentStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'investigating':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Investigation</Badge>;
      case 'identified':
        return <Badge className="bg-orange-500/20 text-orange-400">Identifié</Badge>;
      case 'monitoring':
        return <Badge className="bg-blue-500/20 text-blue-400">Surveillance</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-400">Résolu</Badge>;
    }
  };

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'api-scoring':
        return <TrendingUp className="h-5 w-5" />;
      case 'api-kyc':
        return <Shield className="h-5 w-5" />;
      case 'api-webhooks':
        return <Zap className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'auth':
        return <Shield className="h-5 w-5" />;
      case 'sandbox':
        return <Server className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const allOperational = services.every(s => s.status === 'operational');
  const avgUptime = (services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
  };

  return (
    <>
      <SEOHead
        title="Status API | WOUAKA Developer Portal"
        description="État de santé en temps réel des services WOUAKA. Consultez la disponibilité et les performances de nos APIs."
      />
      <SandboxNavbar />
      
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DeveloperSidebar activeSection={activeSection} onSectionClick={scrollToSection} />
          
          <main className="flex-1 lg:ml-64">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[#0A3D2C] via-[#0A3D2C]/95 to-[#0A3D2C] py-12 px-6 border-b border-white/10">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="h-8 w-8 text-[#D4A017]" />
                      <h1 className="text-3xl font-bold text-white">Status API</h1>
                    </div>
                    <p className="text-white/70">
                      État de santé en temps réel de l'infrastructure WOUAKA
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-white/60">
                      <p>Dernière vérification</p>
                      <p className="font-mono">{lastUpdated.toLocaleTimeString('fr-FR')}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refresh}
                      disabled={isRefreshing}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                </div>

                {/* Global Status Banner */}
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                  allOperational 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-yellow-500/20 border border-yellow-500/30'
                }`}>
                  {allOperational ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                      <div>
                        <p className="font-semibold text-green-400">Tous les systèmes sont opérationnels</p>
                        <p className="text-sm text-green-400/70">Uptime moyen: {avgUptime}%</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                      <div>
                        <p className="font-semibold text-yellow-400">Certains services sont dégradés</p>
                        <p className="text-sm text-yellow-400/70">Nous travaillons à résoudre le problème</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
              <Tabs defaultValue="current" className="space-y-6">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="current">État actuel</TabsTrigger>
                  <TabsTrigger value="uptime">Historique (90 jours)</TabsTrigger>
                  <TabsTrigger value="incidents">Incidents</TabsTrigger>
                </TabsList>

                {/* Current Status */}
                <TabsContent value="current" className="space-y-4">
                  {services.map((service) => (
                    <Card key={service.id} className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted/50">
                              {getServiceIcon(service.id)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{service.name}</h3>
                                {getStatusBadge(service.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground">Latence</p>
                              <p className="font-mono font-medium">{service.latency}ms</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground">Uptime</p>
                              <p className="font-mono font-medium text-green-500">{service.uptime}%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Uptime History */}
                <TabsContent value="uptime" className="space-y-6">
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Historique des 90 derniers jours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1 flex-wrap">
                        {uptimeHistory.map((day, i) => (
                          <div
                            key={i}
                            className={`w-3 h-8 rounded-sm cursor-pointer transition-all hover:scale-110 ${
                              day.status === 'operational' 
                                ? 'bg-green-500' 
                                : day.status === 'degraded' 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            title={`${day.date.toLocaleDateString('fr-FR')}: ${day.uptime}%`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-green-500" />
                          <span>Opérationnel</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                          <span>Dégradé</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-red-500" />
                          <span>Panne</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <p className="text-3xl font-bold text-green-500">99.97%</p>
                            <p className="text-sm text-muted-foreground">Uptime global</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <p className="text-3xl font-bold">156ms</p>
                            <p className="text-sm text-muted-foreground">Latence moyenne</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <p className="text-3xl font-bold">1</p>
                            <p className="text-sm text-muted-foreground">Incidents (90j)</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Incidents */}
                <TabsContent value="incidents" className="space-y-4">
                  {incidents.length === 0 ? (
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Aucun incident récent</h3>
                        <p className="text-muted-foreground">
                          Tous les services fonctionnent normalement.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    incidents.map((incident) => (
                      <Card key={incident.id} className="bg-card/50 border-border/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{incident.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {incident.createdAt.toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getSeverityBadge(incident.severity)}
                              {getIncidentStatusBadge(incident.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4 border-l-2 border-muted pl-4">
                            {incident.updates.map((update, i) => (
                              <div key={i} className="relative">
                                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-muted border-2 border-background" />
                                <p className="text-sm text-muted-foreground mb-1">
                                  {update.timestamp.toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} — <span className="capitalize">{update.status}</span>
                                </p>
                                <p className="text-sm">{update.message}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>

              {/* Subscribe to updates */}
              <Card className="mt-8 bg-gradient-to-r from-[#0A3D2C]/20 to-[#D4A017]/10 border-[#0A3D2C]/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Recevoir les notifications</h3>
                      <p className="text-muted-foreground">
                        Soyez alerté en cas d'incident ou de maintenance planifiée.
                      </p>
                    </div>
                    <Button className="bg-[#0A3D2C] hover:bg-[#0A3D2C]/90">
                      S'abonner aux alertes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      
      <SandboxFooter />
    </>
  );
};

export default DeveloperStatus;
