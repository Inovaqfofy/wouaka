import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Lock,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

interface AllTestsResult {
  timestamp: string;
  suites: TestSuite[];
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  allPassed: boolean;
}

export default function SecurityTests() {
  const [testApiKey, setTestApiKey] = useState("");
  const [testType, setTestType] = useState<"all" | "ssrf" | "rate-limit" | "ssrf-integration">("all");

  const runTestsMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const params = new URLSearchParams({ type: testType });
      if (testApiKey) params.set("api_key", testApiKey);

      const { data, error } = await supabase.functions.invoke(`security-tests?${params.toString()}`);
      
      if (error) throw error;
      return data as AllTestsResult;
    },
    onSuccess: (data) => {
      if (data.allPassed) {
        toast.success(`Tous les tests passés! (${data.totalPassed}/${data.totalPassed + data.totalFailed})`);
      } else {
        toast.error(`${data.totalFailed} test(s) échoué(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const { data: lastResults } = useQuery({
    queryKey: ["security-test-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "security_tests_executed")
        .order("created_at", { ascending: false })
        .limit(10);
      return data;
    }
  });

  const testResults = runTestsMutation.data;

  return (
    <DashboardLayout role="admin" title="Tests de Sécurité">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Tests de Sécurité
            </h1>
            <p className="text-muted-foreground">
              Validation automatisée des protections SSRF et rate limiting
            </p>
          </div>
          <Button
            onClick={() => runTestsMutation.mutate()}
            disabled={runTestsMutation.isPending}
          >
            {runTestsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Exécuter les tests
          </Button>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
            <CardDescription>
              Paramètres pour les tests de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testType">Type de test</Label>
                <Tabs value={testType} onValueChange={(v) => setTestType(v as any)}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="ssrf">SSRF</TabsTrigger>
                    <TabsTrigger value="rate-limit">Rate Limit</TabsTrigger>
                    <TabsTrigger value="ssrf-integration">Intégration</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API (pour tests rate limit)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="wk_..."
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Requis pour les tests de rate limiting et d'intégration SSRF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {testResults && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={testResults.allPassed ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {testResults.allPassed ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <p className="text-2xl font-bold">
                        {testResults.allPassed ? "PASS" : "FAIL"}
                      </p>
                      <p className="text-sm text-muted-foreground">Statut global</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{testResults.totalPassed}</p>
                      <p className="text-sm text-muted-foreground">Tests réussis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{testResults.totalFailed}</p>
                      <p className="text-sm text-muted-foreground">Tests échoués</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{testResults.totalDuration}ms</p>
                      <p className="text-sm text-muted-foreground">Durée totale</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Suites */}
            {testResults.suites.map((suite, suiteIndex) => (
              <Card key={suiteIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {suite.name.includes("SSRF") ? (
                        <Globe className="h-5 w-5 text-blue-600" />
                      ) : suite.name.includes("Rate") ? (
                        <Zap className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-purple-600" />
                      )}
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={suite.failed === 0 ? "default" : "destructive"}>
                        {suite.passed}/{suite.passed + suite.failed}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {suite.duration}ms
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div
                        key={testIndex}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          test.passed
                            ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                            : "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {test.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{test.name}</p>
                            {test.details && (
                              <p className="text-xs text-muted-foreground truncate max-w-md">
                                {test.details}
                              </p>
                            )}
                            {test.error && (
                              <p className="text-xs text-red-600">{test.error}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {test.duration}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Test History */}
        {lastResults && lastResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des tests</CardTitle>
              <CardDescription>10 dernières exécutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lastResults.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {log.metadata?.total_failed === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {log.metadata?.test_type || "all"} - {log.metadata?.total_passed || 0} passés
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.metadata?.total_failed === 0 ? "default" : "secondary"}>
                      {log.metadata?.duration_ms}ms
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Guide des tests</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" /> Tests SSRF
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Vérifie le blocage des IPs privées (10.x, 172.16-31.x, 192.168.x)</li>
                  <li>Vérifie le blocage des endpoints cloud metadata</li>
                  <li>Vérifie l'exigence HTTPS</li>
                  <li>Vérifie le blocage des domaines .local/.internal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" /> Tests Rate Limiting
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Vérifie la présence des headers X-RateLimit-*</li>
                  <li>Vérifie que le compteur décrémente</li>
                  <li>Vérifie le format ISO 8601 du Reset</li>
                  <li>Vérifie la correspondance avec api_keys.rate_limit</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
