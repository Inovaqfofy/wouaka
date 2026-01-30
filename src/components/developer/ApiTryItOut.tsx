import { useState } from "react";
import { 
  Play, 
  Copy, 
  CheckCircle, 
  Loader2, 
  ChevronDown,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  example?: string;
}

interface ApiTryItOutProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  name: string;
  description: string;
  params: EndpointParam[];
  exampleResponse: object;
}

export const ApiTryItOut = ({
  method,
  path,
  name,
  description,
  params,
  exampleResponse
}: ApiTryItOutProps) => {
  const [apiKey, setApiKey] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>(
    params.reduce((acc, p) => ({ ...acc, [p.name]: p.example || p.default || "" }), {})
  );
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ data: object; status: number; duration: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isParamsOpen, setIsParamsOpen] = useState(true);

  const handleParamChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  const buildRequestBody = () => {
    const body: Record<string, any> = {};
    params.forEach(p => {
      const value = paramValues[p.name];
      if (value) {
        if (p.type === "boolean") {
          body[p.name] = value === "true";
        } else if (p.type === "number") {
          body[p.name] = Number(value);
        } else {
          body[p.name] = value;
        }
      }
    });
    return body;
  };

  const executeRequest = async () => {
    if (!apiKey) {
      setError("Veuillez entrer une clé API");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    // Simulate API call
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

    const duration = Date.now() - startTime;
    const isSandbox = apiKey.startsWith("wk_test_");

    // Generate mock response based on endpoint
    let mockResponse: object;
    let status = 200;

    if (!apiKey.startsWith("wk_")) {
      status = 401;
      mockResponse = {
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "La clé API fournie est invalide"
        }
      };
    } else if (path.includes("/score")) {
      const score = Math.floor(Math.random() * 300) + 500;
      mockResponse = {
        success: true,
        data: {
          request_id: `req_${Math.random().toString(36).substring(2, 11)}`,
          score,
          grade: score >= 700 ? "A" : score >= 600 ? "B" : score >= 500 ? "C" : "D",
          risk_level: score >= 650 ? "low" : score >= 500 ? "medium" : "high",
          confidence: (0.75 + Math.random() * 0.2).toFixed(2),
          recommendation: score >= 600 ? "approved" : score >= 450 ? "review" : "declined",
          factors: [
            { name: "payment_history", score: Math.floor(Math.random() * 30) + 70, weight: 0.35 },
            { name: "credit_utilization", score: Math.floor(Math.random() * 40) + 50, weight: 0.25 },
          ],
          processing_time_ms: duration,
          environment: isSandbox ? "sandbox" : "production"
        }
      };
    } else if (path.includes("/kyc")) {
      mockResponse = {
        success: true,
        data: {
          request_id: `kyc_${Math.random().toString(36).substring(2, 11)}`,
          verified: Math.random() > 0.2,
          identity_score: Math.floor(Math.random() * 20) + 80,
          fraud_score: Math.floor(Math.random() * 15),
          risk_level: "low",
          checks: {
            document_authenticity: "passed",
            face_match: "passed",
            liveness: "passed"
          },
          environment: isSandbox ? "sandbox" : "production"
        }
      };
    } else {
      mockResponse = exampleResponse;
    }

    setResponse({ data: mockResponse, status, duration });
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateCurl = () => {
    const body = buildRequestBody();
    return `curl -X ${method} "https://api.wouaka-creditscore.com${path}" \\
  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`;
  };

  const generateJavaScript = () => {
    const body = buildRequestBody();
    return `const response = await fetch("https://api.wouaka-creditscore.com${path}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer ${apiKey || "YOUR_API_KEY"}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});

const data = await response.json();
console.log(data);`;
  };

  const generatePython = () => {
    const body = buildRequestBody();
    return `import requests

response = requests.${method.toLowerCase()}(
    "https://api.wouaka-creditscore.com${path}",
    headers={
        "Authorization": "Bearer ${apiKey || "YOUR_API_KEY"}",
        "Content-Type": "application/json"
    },
    json=${JSON.stringify(body, null, 2).replace(/"/g, "'")}
)

print(response.json())`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge 
              variant="default" 
              className={cn(
                method === "GET" && "bg-blue-500",
                method === "POST" && "bg-emerald-500",
                method === "PUT" && "bg-amber-500",
                method === "DELETE" && "bg-red-500"
              )}
            >
              {method}
            </Badge>
            <code className="text-sm font-mono">{path}</code>
          </div>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            Try it out
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Key */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Clé API</Label>
          <Input
            type="password"
            placeholder="wk_test_xxxxxxxxx ou wk_live_xxxxxxxxx"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Utilisez <code className="text-secondary">wk_test_</code> pour le mode sandbox
          </p>
        </div>

        {/* Parameters */}
        <Collapsible open={isParamsOpen} onOpenChange={setIsParamsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <span className="font-medium">Paramètres ({params.length})</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isParamsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {params.map((param) => (
              <div key={param.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-mono">{param.name}</Label>
                  <Badge variant="outline" className="text-[10px] px-1.5">{param.type}</Badge>
                  {param.required && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">requis</Badge>
                  )}
                </div>
                <Input
                  value={paramValues[param.name] || ""}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.example || param.description}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{param.description}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Execute Button */}
        <Button 
          onClick={executeRequest} 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90"
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

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Réponse</span>
                <Badge className={response.status === 200 ? "bg-emerald-500" : "bg-red-500"}>
                  {response.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {response.duration}ms
              </div>
            </div>
            <div className="relative">
              <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] rounded-lg overflow-x-auto text-sm">
                <code>{JSON.stringify(response.data, null, 2)}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs text-[#8b949e] hover:text-white"
                onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2), "response")}
              >
                {copied === "response" ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Code Snippets */}
        <div className="pt-4 border-t">
          <span className="text-sm font-medium mb-3 block">Code généré</span>
          <Tabs defaultValue="curl">
            <TabsList className="mb-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="curl">
              <div className="relative">
                <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] rounded-lg overflow-x-auto text-xs">
                  <code>{generateCurl()}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 text-xs text-[#8b949e] hover:text-white"
                  onClick={() => copyToClipboard(generateCurl(), "curl")}
                >
                  {copied === "curl" ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="javascript">
              <div className="relative">
                <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] rounded-lg overflow-x-auto text-xs">
                  <code>{generateJavaScript()}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 text-xs text-[#8b949e] hover:text-white"
                  onClick={() => copyToClipboard(generateJavaScript(), "js")}
                >
                  {copied === "js" ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="python">
              <div className="relative">
                <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] rounded-lg overflow-x-auto text-xs">
                  <code>{generatePython()}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 text-xs text-[#8b949e] hover:text-white"
                  onClick={() => copyToClipboard(generatePython(), "python")}
                >
                  {copied === "python" ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
