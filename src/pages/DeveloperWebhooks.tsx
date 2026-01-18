import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Webhook, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Code,
  ArrowRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { DeveloperSidebar, CodeBlockEnhanced } from '@/components/developer';
import { useWebhooks, Webhook as WebhookType } from '@/hooks/useWebhooks';
import { useToast } from '@/hooks/use-toast';

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  category: 'scoring' | 'kyc' | 'certificate';
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  statusCode: number | null;
  duration: number;
  timestamp: Date;
  payload: object;
  response: string | null;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'score.completed', name: 'score.completed', description: 'Un score a été calculé avec succès', category: 'scoring' },
  { id: 'score.failed', name: 'score.failed', description: 'Le calcul du score a échoué', category: 'scoring' },
  { id: 'kyc.verified', name: 'kyc.verified', description: 'Vérification KYC réussie', category: 'kyc' },
  { id: 'kyc.failed', name: 'kyc.failed', description: 'Vérification KYC échouée', category: 'kyc' },
  { id: 'kyc.pending_review', name: 'kyc.pending_review', description: 'KYC en attente de revue manuelle', category: 'kyc' },
  { id: 'certificate.created', name: 'certificate.created', description: 'Un certificat a été généré', category: 'certificate' },
  { id: 'certificate.expired', name: 'certificate.expired', description: 'Un certificat a expiré', category: 'certificate' },
  { id: 'certificate.shared', name: 'certificate.shared', description: 'Un certificat a été partagé', category: 'certificate' },
];

const DeveloperWebhooks = () => {
  const [activeSection, setActiveSection] = useState('webhooks');
  const { webhooks, isLoading, createWebhook, deleteWebhook, toggleWebhook } = useWebhooks();
  const { toast } = useToast();
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // Test webhook states
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Simulated delivery logs
  const [deliveryLogs] = useState<DeliveryLog[]>([
    {
      id: '1',
      webhookId: 'wh_1',
      event: 'score.completed',
      status: 'success',
      statusCode: 200,
      duration: 234,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      payload: { score: 720, risk_category: 'low' },
      response: 'OK'
    },
    {
      id: '2',
      webhookId: 'wh_1',
      event: 'kyc.verified',
      status: 'success',
      statusCode: 200,
      duration: 156,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      payload: { verification_id: 'kyc_abc123', level: 'enhanced' },
      response: 'OK'
    },
    {
      id: '3',
      webhookId: 'wh_1',
      event: 'score.completed',
      status: 'failed',
      statusCode: 500,
      duration: 1024,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      payload: { score: 650, risk_category: 'medium' },
      response: 'Internal Server Error'
    },
  ]);

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl || !newWebhookName || selectedEvents.length === 0) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs et sélectionner au moins un événement.',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    const result = await createWebhook(newWebhookName, newWebhookUrl, selectedEvents);
    setIsCreating(false);

    if (result?.secret) {
      setCreatedSecret(result.secret);
    } else {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewWebhookUrl('');
    setNewWebhookName('');
    setSelectedEvents([]);
    setCreatedSecret(null);
    setShowSecret(false);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId);
    setTestResult(null);
    
    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.2;
    setTestResult({
      success,
      message: success 
        ? 'Webhook test envoyé avec succès! Vérifiez votre endpoint.' 
        : 'Échec de la connexion à votre endpoint. Vérifiez l\'URL.'
    });
    setTestingWebhookId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié!' });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
  };

  const getStatusIcon = (status: DeliveryLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const hmacVerificationCode = `const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expectedSignature}\`)
  );
}

// Dans votre handler de webhook
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-wouaka-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Traiter le webhook...
  console.log('Événement reçu:', req.body.event);
  res.status(200).json({ received: true });
});`;

  return (
    <>
      <SEOHead
        title="Webhooks | WOUAKA Developer Portal"
        description="Configurez et gérez vos webhooks pour recevoir des notifications en temps réel de l'API WOUAKA."
      />
      <Navbar />
      
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DeveloperSidebar activeSection={activeSection} onSectionClick={scrollToSection} />
          
          <main className="flex-1 lg:ml-64">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[#0A3D2C] via-[#0A3D2C]/95 to-[#0A3D2C] py-12 px-6 border-b border-white/10">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Webhook className="h-8 w-8 text-[#D4A017]" />
                  <h1 className="text-3xl font-bold text-white">Webhooks</h1>
                </div>
                <p className="text-white/70 max-w-2xl">
                  Recevez des notifications en temps réel lorsque des événements se produisent sur votre compte. 
                  Configurez vos endpoints et testez-les directement depuis cette interface.
                </p>
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
              <Tabs defaultValue="manage" className="space-y-6">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="manage">Gérer les webhooks</TabsTrigger>
                  <TabsTrigger value="logs">Logs de livraison</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                </TabsList>

                {/* Manage Webhooks */}
                <TabsContent value="manage" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Vos webhooks</h2>
                      <p className="text-muted-foreground">Gérez vos endpoints de notification</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#0A3D2C] hover:bg-[#0A3D2C]/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau webhook
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        {createdSecret ? (
                          <>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-5 w-5" />
                                Webhook créé avec succès
                              </DialogTitle>
                              <DialogDescription>
                                Copiez le secret ci-dessous. Il ne sera plus affiché après fermeture.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="font-medium">Important</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Ce secret est utilisé pour vérifier que les webhooks proviennent bien de WOUAKA. 
                                  Stockez-le de manière sécurisée.
                                </p>
                              </div>
                              <div>
                                <Label>Secret du webhook</Label>
                                <div className="flex gap-2 mt-1">
                                  <div className="flex-1 relative">
                                    <Input
                                      type={showSecret ? 'text' : 'password'}
                                      value={createdSecret}
                                      readOnly
                                      className="font-mono pr-10"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-1 top-1/2 -translate-y-1/2"
                                      onClick={() => setShowSecret(!showSecret)}
                                    >
                                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => copyToClipboard(createdSecret)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleCloseCreate}>
                                J'ai copié le secret
                              </Button>
                            </DialogFooter>
                          </>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle>Créer un webhook</DialogTitle>
                              <DialogDescription>
                                Configurez un nouvel endpoint pour recevoir les notifications.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                  id="name"
                                  placeholder="Production Webhook"
                                  value={newWebhookName}
                                  onChange={(e) => setNewWebhookName(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="url">URL de l'endpoint</Label>
                                <Input
                                  id="url"
                                  placeholder="https://votre-api.com/webhooks/wouaka"
                                  value={newWebhookUrl}
                                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Événements à écouter</Label>
                                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                  {WEBHOOK_EVENTS.map((event) => (
                                    <div
                                      key={event.id}
                                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedEvents.includes(event.id)
                                          ? 'bg-[#0A3D2C]/10 border-[#0A3D2C]'
                                          : 'hover:bg-muted/50'
                                      }`}
                                      onClick={() => toggleEvent(event.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <code className="text-sm font-mono">{event.name}</code>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {event.description}
                                          </p>
                                        </div>
                                        <Switch checked={selectedEvents.includes(event.id)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={handleCloseCreate}>
                                Annuler
                              </Button>
                              <Button 
                                onClick={handleCreateWebhook}
                                disabled={isCreating}
                                className="bg-[#0A3D2C] hover:bg-[#0A3D2C]/90"
                              >
                                {isCreating ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Création...
                                  </>
                                ) : (
                                  'Créer le webhook'
                                )}
                              </Button>
                            </DialogFooter>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  {testResult && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${
                      testResult.success 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <p className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                        {testResult.message}
                      </p>
                    </div>
                  )}

                  {isLoading ? (
                    <Card className="bg-card/50">
                      <CardContent className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Chargement...</p>
                      </CardContent>
                    </Card>
                  ) : webhooks.length === 0 ? (
                    <Card className="bg-card/50 border-dashed">
                      <CardContent className="p-8 text-center">
                        <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Aucun webhook configuré</h3>
                        <p className="text-muted-foreground mb-4">
                          Créez votre premier webhook pour recevoir des notifications en temps réel.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#0A3D2C] hover:bg-[#0A3D2C]/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un webhook
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {webhooks.map((webhook) => (
                        <Card key={webhook.id} className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">{webhook.name}</h3>
                                  <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                                    {webhook.is_active ? 'Actif' : 'Inactif'}
                                  </Badge>
                                  {webhook.failure_count && webhook.failure_count > 0 && (
                                    <Badge variant="destructive">
                                      {webhook.failure_count} échecs
                                    </Badge>
                                  )}
                                </div>
                                <code className="text-sm text-muted-foreground font-mono">
                                  {webhook.url}
                                </code>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {webhook.events.map((event) => (
                                    <Badge key={event} variant="outline" className="text-xs">
                                      {event}
                                    </Badge>
                                  ))}
                                </div>
                                {webhook.last_triggered_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Dernier déclenchement: {new Date(webhook.last_triggered_at).toLocaleString('fr-FR')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={webhook.is_active ?? false}
                                  onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTestWebhook(webhook.id)}
                                  disabled={testingWebhookId === webhook.id}
                                >
                                  {testingWebhookId === webhook.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-1" />
                                      Tester
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteWebhook(webhook.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Delivery Logs */}
                <TabsContent value="logs" className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Logs de livraison</h2>
                    <p className="text-muted-foreground">
                      Historique des tentatives d'envoi de webhooks
                    </p>
                  </div>

                  <Card className="bg-card/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Statut</TableHead>
                          <TableHead>Événement</TableHead>
                          <TableHead>Code HTTP</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deliveryLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(log.status)}
                                <span className="capitalize">{log.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm">{log.event}</code>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={log.statusCode === 200 ? 'default' : 'destructive'}
                                className={log.statusCode === 200 ? 'bg-green-500/20 text-green-400' : ''}
                              >
                                {log.statusCode || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.duration}ms
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.timestamp.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Code className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Détails de la livraison</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Payload envoyé</Label>
                                      <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-48">
                                        {JSON.stringify(log.payload, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <Label>Réponse du serveur</Label>
                                      <pre className="mt-1 p-3 bg-muted rounded-lg text-sm">
                                        {log.response || 'Aucune réponse'}
                                      </pre>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Vérification des signatures</h2>
                    <p className="text-muted-foreground">
                      Sécurisez vos webhooks en vérifiant les signatures HMAC
                    </p>
                  </div>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Pourquoi vérifier les signatures ?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Chaque webhook envoyé par WOUAKA inclut un header <code className="bg-muted px-1 rounded">X-Wouaka-Signature</code> 
                        contenant une signature HMAC-SHA256. Cette signature vous permet de vérifier que le webhook provient 
                        bien de WOUAKA et n'a pas été altéré.
                      </p>
                      
                      <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="p-2 rounded-full bg-[#0A3D2C]/20">
                          <ArrowRight className="h-4 w-4 text-[#0A3D2C]" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Process de vérification</h4>
                          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Récupérez le header <code>X-Wouaka-Signature</code></li>
                            <li>Calculez le HMAC-SHA256 du body avec votre secret</li>
                            <li>Comparez les deux valeurs de manière sécurisée</li>
                            <li>Rejetez la requête si les signatures ne correspondent pas</li>
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Exemple d'implémentation (Node.js)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlockEnhanced
                        code={hmacVerificationCode}
                        language="javascript"
                        showLineNumbers
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-[#D4A017]/10 border-[#D4A017]/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#D4A017] mt-0.5" />
                        <div>
                          <h4 className="font-medium text-[#D4A017]">Bonnes pratiques de sécurité</h4>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Utilisez toujours HTTPS pour vos endpoints webhook</li>
                            <li>• Vérifiez la signature avant de traiter le payload</li>
                            <li>• Utilisez <code>timingSafeEqual</code> pour éviter les timing attacks</li>
                            <li>• Répondez rapidement ({"<"}5s) pour éviter les timeouts</li>
                            <li>• Traitez les webhooks de manière asynchrone si nécessaire</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default DeveloperWebhooks;
