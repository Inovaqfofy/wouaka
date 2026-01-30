import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Play, 
  Key, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  User,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Clock,
  Zap,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  Phone,
  TestTube,
  Wand2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { ApiStatusWidget, CodeBlockEnhanced, DeveloperSidebar } from "@/components/developer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Magic phone numbers for testing
const magicNumbers = [
  { 
    number: "+225 01 01 01 01 01", 
    description: "Score parfait (850)", 
    scenario: "Client idéal avec historique impeccable",
    expectedScore: 850,
    expectedGrade: "A+",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  { 
    number: "+225 02 02 02 02 02", 
    description: "Score élevé (720)", 
    scenario: "Bon client avec quelques retards mineurs",
    expectedScore: 720,
    expectedGrade: "A",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  { 
    number: "+225 03 03 03 03 03", 
    description: "Score moyen (550)", 
    scenario: "Client standard, risque modéré",
    expectedScore: 550,
    expectedGrade: "C",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  { 
    number: "+225 04 04 04 04 04", 
    description: "Score faible (380)", 
    scenario: "Client à risque, nombreux incidents",
    expectedScore: 380,
    expectedGrade: "D",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  { 
    number: "+225 05 05 05 05 05", 
    description: "Score minimal (300)", 
    scenario: "Client très risqué, à décliner",
    expectedScore: 300,
    expectedGrade: "E",
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  { 
    number: "+225 00 00 00 00 00", 
    description: "Données insuffisantes", 
    scenario: "Nouveau client sans historique",
    expectedScore: null,
    expectedGrade: "N/A",
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
  { 
    number: "+225 99 99 99 99 99", 
    description: "Erreur KYC", 
    scenario: "Simule une erreur de vérification",
    expectedScore: null,
    expectedGrade: "ERROR",
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
];

// Simulated test profiles
const testProfiles = [
  {
    id: "ideal",
    name: "Client Idéal",
    description: "Score élevé, faible risque",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    data: {
      phone_number: "+22501010101",
      full_name: "Amadou Koné",
      national_id: "CI-1990051234",
      country: "CI",
      consent: true
    },
    expectedScore: { min: 720, max: 850 },
    expectedGrade: "A",
    riskLevel: "low"
  },
  {
    id: "medium",
    name: "Client Standard",
    description: "Score moyen, risque modéré",
    icon: Users,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    data: {
      phone_number: "+22503030303",
      full_name: "Fatou Diallo",
      national_id: "SN-1985082345",
      country: "SN",
      consent: true
    },
    expectedScore: { min: 450, max: 600 },
    expectedGrade: "C",
    riskLevel: "medium"
  },
  {
    id: "risky",
    name: "Client à Risque",
    description: "Score faible, risque élevé",
    icon: TrendingDown,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    data: {
      phone_number: "+22505050505",
      full_name: "Ibrahim Touré",
      national_id: "ML-1995033456",
      country: "ML",
      consent: true
    },
    expectedScore: { min: 300, max: 400 },
    expectedGrade: "E",
    riskLevel: "high"
  },
  {
    id: "new",
    name: "Nouveau Client",
    description: "Données insuffisantes",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    data: {
      phone_number: "+22500000000",
      full_name: "Koffi Mensah",
      country: "BJ",
      consent: true
    },
    expectedScore: { min: 0, max: 0 },
    expectedGrade: "N/A",
    riskLevel: "unknown"
  }
];

interface LogEntry {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  status: number;
  duration: number;
  request: object;
  response: object;
}

const DeveloperSandbox = () => {
  const [testApiKey, setTestApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(testProfiles[0]);
  const [customPayload, setCustomPayload] = useState(JSON.stringify(testProfiles[0].data, null, 2));
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<object | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/v1/score");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("simulator");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Generate test API key
  const generateTestApiKey = () => {
    const key = `wk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setTestApiKey(key);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Select profile
  const selectProfile = (profile: typeof testProfiles[0]) => {
    setSelectedProfile(profile);
    setCustomPayload(JSON.stringify(profile.data, null, 2));
  };

  // Use magic number
  const useMagicNumber = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    const currentData = JSON.parse(customPayload);
    currentData.phone_number = cleanNumber;
    setCustomPayload(JSON.stringify(currentData, null, 2));
  };

  // Get expected response for magic number
  const getExpectedResponse = (phoneNumber: string) => {
    const magic = magicNumbers.find(m => m.number.replace(/\s/g, "") === phoneNumber.replace(/\s/g, ""));
    if (magic) {
      if (magic.expectedGrade === "ERROR") {
        return {
          success: false,
          error: {
            code: "KYC_VERIFICATION_FAILED",
            message: "Impossible de vérifier l'identité du client"
          }
        };
      }
      if (magic.expectedScore === null) {
        return {
          success: true,
          data: {
            status: "insufficient_data",
            message: "Données insuffisantes pour calculer un score",
            recommendation: "collect_more_data"
          }
        };
      }
      return {
        success: true,
        data: {
          score: magic.expectedScore,
          grade: magic.expectedGrade,
          risk_level: magic.expectedScore >= 650 ? "low" : magic.expectedScore >= 500 ? "medium" : "high",
          confidence: 0.95,
          recommendation: magic.expectedScore >= 600 ? "approved" : magic.expectedScore >= 450 ? "review" : "declined"
        }
      };
    }
    return null;
  };

  // Run simulation
  const runSimulation = async () => {
    if (!testApiKey) {
      alert("Veuillez d'abord générer une clé API de test");
      return;
    }

    setIsRunning(true);
    setResponse(null);

    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    const duration = Date.now() - startTime;

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(customPayload);
    } catch (e) {
      setResponse({ success: false, error: { code: "INVALID_JSON", message: "Le payload n'est pas un JSON valide" } });
      setIsRunning(false);
      return;
    }

    // Check for magic number response
    const magicResponse = getExpectedResponse(parsedPayload.phone_number || "");
    
    let mockResponse: object;
    let status = 200;

    if (magicResponse) {
      mockResponse = {
        ...magicResponse,
        meta: {
          request_id: `req_${Math.random().toString(36).substring(2, 11)}`,
          processing_time_ms: duration,
          environment: "sandbox",
          api_version: "2.0"
        }
      };
      if (!magicResponse.success) status = 400;
    } else {
      // Default response
      const profile = selectedProfile;
      const score = Math.floor(Math.random() * (profile.expectedScore.max - profile.expectedScore.min)) + profile.expectedScore.min;
      
      mockResponse = {
        success: true,
        data: {
          request_id: `req_${Math.random().toString(36).substring(2, 11)}`,
          score: score || 500,
          grade: profile.expectedGrade,
          risk_level: profile.riskLevel,
          confidence: (0.75 + Math.random() * 0.2).toFixed(2),
          recommendation: score >= 600 ? "approved" : score >= 450 ? "review" : "declined",
          factors: [
            { name: "payment_history", score: Math.floor(Math.random() * 30) + 70, weight: 0.35 },
            { name: "credit_utilization", score: Math.floor(Math.random() * 40) + 50, weight: 0.25 },
            { name: "account_age", score: Math.floor(Math.random() * 50) + 40, weight: 0.20 },
            { name: "identity_verification", score: Math.floor(Math.random() * 20) + 80, weight: 0.20 },
          ]
        },
        meta: {
          processing_time_ms: duration,
          environment: "sandbox",
          api_version: "2.0"
        }
      };
    }

    setResponse(mockResponse);

    // Add to logs
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      method: "POST",
      endpoint: selectedEndpoint,
      status: status,
      duration: duration,
      request: parsedPayload,
      response: mockResponse
    };
    setLogs(prev => [logEntry, ...prev].slice(0, 50));

    setIsRunning(false);
  };

  // Clear logs
  const clearLogs = () => setLogs([]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      <SEOHead
        title="Sandbox API | WOUAKA Developer Portal"
        description="Testez l'API WOUAKA en mode sandbox. Simulez différents profils d'emprunteurs et visualisez les réponses en temps réel."
        keywords="API sandbox, test API scoring, simulation crédit, developer tools"
        canonical="/developer/sandbox"
      />
      <Navbar />
      
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DeveloperSidebar activeSection="sandbox" onSectionClick={() => {}} />
          
          <main className="flex-1 lg:ml-64">
            {/* Hero Section */}
            <section className="relative py-12 bg-gradient-to-br from-[#0A3D2C] via-[#0A3D2C]/95 to-[#0A3D2C] overflow-hidden border-b border-white/10">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
              <div className="max-w-5xl mx-auto px-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4A017] flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#0A3D2C]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Sandbox API</h1>
                    <p className="text-white/70">Environnement de test sécurisé</p>
                  </div>
                </div>
                
                <p className="text-white/80 max-w-2xl">
                  Testez l'intégration de l'API WOUAKA sans consommer de crédits réels. 
                  Utilisez les numéros magiques pour simuler différents scénarios.
                </p>
              </div>
            </section>

            <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="simulator" className="gap-2">
              <Play className="w-4 h-4" />
              Simulateur
            </TabsTrigger>
            <TabsTrigger value="magic" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Numéros Magiques
            </TabsTrigger>
            <TabsTrigger value="debug" className="gap-2">
              <TestTube className="w-4 h-4" />
              Console Debug
            </TabsTrigger>
          </TabsList>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Controls */}
              <div className="lg:col-span-2 space-y-8">
                {/* API Key Section */}
                <Card className="border-secondary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-secondary" />
                      Clé API Sandbox
                    </CardTitle>
                    <CardDescription>
                      Les clés <code className="text-secondary">wk_test_</code> n'utilisent pas de crédits réels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!testApiKey ? (
                      <Button onClick={generateTestApiKey} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Générer une clé de test
                      </Button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-muted rounded-lg font-mono text-sm">
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                            SANDBOX
                          </Badge>
                          <span className="flex-1 truncate">
                            {showApiKey ? testApiKey : testApiKey.replace(/./g, '•').slice(0, 40)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(testApiKey, "apikey")}>
                          {copied === "apikey" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={generateTestApiKey}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Profile Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Profils de Test
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez un profil type pour simuler différents scénarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {testProfiles.map((profile) => {
                        const Icon = profile.icon;
                        return (
                          <button
                            key={profile.id}
                            onClick={() => selectProfile(profile)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              selectedProfile.id === profile.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", profile.bgColor)}>
                              <Icon className={cn("w-5 h-5", profile.color)} />
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{profile.name}</h4>
                            <p className="text-xs text-muted-foreground">{profile.description}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Endpoint + Payload */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1 block">Endpoint</Label>
                          <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="/v1/score">POST /v1/score</SelectItem>
                              <SelectItem value="/v1/kyc/verify">POST /v1/kyc/verify</SelectItem>
                              <SelectItem value="/v1/precheck">POST /v1/precheck</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={runSimulation} 
                          disabled={isRunning || !testApiKey}
                          className="bg-primary hover:bg-primary/90 h-10 px-6 mt-5"
                        >
                          {isRunning ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Exécution...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Exécuter
                            </>
                          )}
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Request Body (JSON)</Label>
                        <Textarea
                          value={customPayload}
                          onChange={(e) => setCustomPayload(e.target.value)}
                          className="font-mono text-sm h-40 bg-[#0d1117] text-[#c9d1d9] border-[#30363d]"
                          placeholder="Payload JSON..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Panel */}
                <AnimatePresence>
                  {response && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className={cn(
                        "border-2",
                        (response as any).success 
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-red-500/30 bg-red-500/5"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={cn(
                              "flex items-center gap-2",
                              (response as any).success ? "text-emerald-600" : "text-red-600"
                            )}>
                              {(response as any).success ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <AlertCircle className="w-5 h-5" />
                              )}
                              Réponse API
                            </CardTitle>
                            <Badge className={(response as any).success ? "bg-emerald-500" : "bg-red-500"}>
                              {(response as any).success ? "200 OK" : "400 Error"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlockEnhanced
                            code={JSON.stringify(response, null, 2)}
                            language="json"
                            title="response.json"
                            showLineNumbers={true}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column - Status & Logs */}
              <div className="space-y-6">
                <ApiStatusWidget />

                {/* Real-time Logs */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Logs Temps Réel
                      </CardTitle>
                      {logs.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearLogs}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Effacer
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] overflow-y-auto space-y-2 pr-2">
                      {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucune requête</p>
                        </div>
                      ) : (
                        logs.map((log) => (
                          <div 
                            key={log.id} 
                            className="p-3 rounded-lg bg-muted/50 border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{log.method}</Badge>
                                <span className="font-mono">{log.endpoint}</span>
                              </div>
                              <Badge className={log.status === 200 ? "bg-emerald-500" : "bg-red-500"}>
                                {log.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>{log.timestamp.toLocaleTimeString('fr-FR')}</span>
                              <span>{log.duration}ms</span>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Magic Numbers Tab */}
          <TabsContent value="magic" id="magic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-secondary" />
                  Numéros de Téléphone Magiques
                </CardTitle>
                <CardDescription>
                  Utilisez ces numéros pour déclencher des scénarios spécifiques en mode sandbox. 
                  Aucun appel réel n'est effectué.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {magicNumbers.map((magic, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all hover:shadow-md",
                        magic.bgColor
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Phone className={cn("w-4 h-4", magic.color)} />
                          <code className="font-mono text-sm font-semibold">{magic.number}</code>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7"
                          onClick={() => useMagicNumber(magic.number)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Utiliser
                        </Button>
                      </div>
                      <h4 className={cn("font-semibold text-sm mb-1", magic.color)}>
                        {magic.description}
                      </h4>
                      <p className="text-xs text-muted-foreground">{magic.scenario}</p>
                      {magic.expectedScore !== null && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", magic.color)}>
                            Score: {magic.expectedScore}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Grade: {magic.expectedGrade}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-secondary/10 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Comment utiliser les numéros magiques ?</p>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                      <li>Cliquez sur "Utiliser" pour copier le numéro dans votre payload</li>
                      <li>Exécutez la requête dans le simulateur</li>
                      <li>Observez la réponse correspondant au scénario choisi</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Console Tab */}
          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-primary" />
                      Console de Débogage
                    </CardTitle>
                    <CardDescription>
                      Historique détaillé de toutes les requêtes effectuées dans cette session
                    </CardDescription>
                  </div>
                  {logs.length > 0 && (
                    <Button variant="outline" onClick={clearLogs}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Effacer tout
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <TestTube className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Aucune requête enregistrée</p>
                    <p className="text-sm">Exécutez des requêtes dans le simulateur pour voir les logs ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{log.method}</Badge>
                            <code className="font-mono text-sm">{log.endpoint}</code>
                            <Badge className={log.status === 200 ? "bg-emerald-500" : "bg-red-500"}>
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {log.duration}ms
                            </span>
                            <span>{log.timestamp.toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                          <div className="p-4">
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Request</h4>
                            <pre className="text-xs bg-[#0d1117] text-[#c9d1d9] p-3 rounded overflow-x-auto">
                              {JSON.stringify(log.request, null, 2)}
                            </pre>
                          </div>
                          <div className="p-4">
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Response</h4>
                            <pre className="text-xs bg-[#0d1117] text-[#c9d1d9] p-3 rounded overflow-x-auto">
                              {JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

export default DeveloperSandbox;
