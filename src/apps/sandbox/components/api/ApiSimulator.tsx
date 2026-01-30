import { useState } from 'react';
import { Play, Copy, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const ENDPOINTS = [
  { 
    id: 'score', 
    name: 'Calculer un score', 
    method: 'POST', 
    path: '/partners/score',
    defaultBody: JSON.stringify({
      full_name: "Marie Dupont",
      phone_number: "+225 07 00 00 00",
      monthly_income: 500000,
      monthly_expenses: 300000,
      mobile_money_transactions: 45,
      mobile_money_volume: 1500000,
      sim_age_months: 24,
      city: "Abidjan",
      region: "Lagunes"
    }, null, 2)
  },
  { 
    id: 'kyc', 
    name: 'Vérification KYC', 
    method: 'POST', 
    path: '/partners/kyc',
    defaultBody: JSON.stringify({
      user_id: "uuid-here",
      document_type: "national_id",
      document_number: "CI123456789"
    }, null, 2)
  },
  { 
    id: 'identity', 
    name: 'Vérification identité', 
    method: 'POST', 
    path: '/partners/identity/check',
    defaultBody: JSON.stringify({
      full_name: "Marie Dupont",
      national_id: "CI123456789",
      date_of_birth: "1990-01-15"
    }, null, 2)
  },
  { 
    id: 'webhooks-register', 
    name: 'Enregistrer webhook', 
    method: 'POST', 
    path: '/partners/webhooks/register',
    defaultBody: JSON.stringify({
      name: "Mon webhook",
      url: "https://api.example.com/webhook",
      events: ["score.completed", "kyc.validated"]
    }, null, 2)
  },
  { 
    id: 'webhooks-test', 
    name: 'Tester webhook', 
    method: 'GET', 
    path: '/partners/webhooks/test',
    defaultBody: ''
  },
];

export function ApiSimulator() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultBody);
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleEndpointChange = (endpointId: string) => {
    const endpoint = ENDPOINTS.find(e => e.id === endpointId);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      setRequestBody(endpoint.defaultBody);
      setResponse(null);
    }
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      // Build function name from path
      const functionName = selectedEndpoint.path.replace('/partners/', 'partners-').replace('/', '-');
      
      const options: any = {
        method: selectedEndpoint.method,
      };

      if (selectedEndpoint.method === 'POST' && requestBody) {
        options.body = JSON.parse(requestBody);
      }

      // Add custom API key header if provided
      if (apiKey) {
        options.headers = {
          'X-API-Key': apiKey,
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, options);

      setResponseTime(Date.now() - startTime);
      
      if (error) {
        setResponse({ error: error.message, status: 'error' });
      } else {
        setResponse(data);
      }
    } catch (error: any) {
      setResponseTime(Date.now() - startTime);
      setResponse({ error: error.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCurl = () => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
    const functionName = selectedEndpoint.path.replace('/partners/', 'partners-').replace('/', '-');
    
    let curl = `curl -X ${selectedEndpoint.method} "${baseUrl}/${functionName}"`;
    curl += ` \\\n  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    
    if (selectedEndpoint.method === 'POST' && requestBody) {
      curl += ` \\\n  -d '${requestBody.replace(/\n\s*/g, '')}'`;
    }
    
    return curl;
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="w-5 h-5" />
          Simulateur API
        </CardTitle>
        <CardDescription>Testez les endpoints de l'API Wouaka en temps réel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <div className="space-y-4">
            <div>
              <Label>Endpoint</Label>
              <Select value={selectedEndpoint.id} onValueChange={handleEndpointChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map(endpoint => (
                    <SelectItem key={endpoint.id} value={endpoint.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant={endpoint.method === 'POST' ? 'default' : 'outline'} className="text-xs">
                          {endpoint.method}
                        </Badge>
                        {endpoint.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Clé API (optionnel)</Label>
              <Input
                type="password"
                placeholder="wk_live_xxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            {selectedEndpoint.method === 'POST' && (
              <div>
                <Label>Corps de la requête (JSON)</Label>
                <Textarea
                  className="font-mono text-sm h-64"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                />
              </div>
            )}

            <Button 
              onClick={executeRequest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Exécuter la requête
                </>
              )}
            </Button>
          </div>

          {/* Response Panel */}
          <div>
            <Tabs defaultValue="response">
              <TabsList className="w-full">
                <TabsTrigger value="response" className="flex-1">Réponse</TabsTrigger>
                <TabsTrigger value="curl" className="flex-1">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="response" className="mt-4">
                <div className="relative">
                  {responseTime !== null && (
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={response?.error ? 'destructive' : 'success'}>
                        {response?.error ? 'Erreur' : 'Succès'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{responseTime}ms</span>
                    </div>
                  )}
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-xl overflow-auto h-72 text-sm">
                      {response 
                        ? JSON.stringify(response, null, 2) 
                        : 'Cliquez sur "Exécuter" pour voir la réponse'}
                    </pre>
                    {response && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={copyResponse}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curl" className="mt-4">
                <div className="relative">
                  <pre className="bg-foreground text-background p-4 rounded-xl overflow-auto h-72 text-sm">
                    {generateCurl()}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-background hover:bg-background/20"
                    onClick={() => navigator.clipboard.writeText(generateCurl())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
