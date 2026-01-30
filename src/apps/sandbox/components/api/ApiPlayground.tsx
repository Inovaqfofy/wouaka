import { useState } from "react";
import { Play, Copy, Check, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EndpointConfig {
  id: string;
  name: string;
  method: string;
  path: string;
  price: string;
  fields: {
    name: string;
    label: string;
    placeholder: string;
    required: boolean;
    type?: string;
  }[];
  mockResponse: Record<string, unknown>;
}

const endpoints: EndpointConfig[] = [
  {
    id: "score",
    name: "Inclusion Score",
    method: "POST",
    path: "/v1/score",
    price: "5 000 FCFA",
    fields: [
      { name: "phone_number", label: "Numéro de téléphone", placeholder: "+221 77 123 45 67", required: true },
      { name: "full_name", label: "Nom complet", placeholder: "Amadou Diallo", required: true },
      { name: "national_id", label: "Numéro CNI (optionnel)", placeholder: "CI-123456789", required: false },
    ],
    mockResponse: {
      success: true,
      score: 78,
      grade: "B+",
      reliability_score: 82,
      stability_score: 75,
      short_term_risk: 71,
      engagement_capacity: 84,
      risk_level: "low",
      confidence: 92,
      processing_time_ms: 1824,
      explanations: [
        "Stabilité télécom élevée (même numéro depuis 4+ ans)",
        "Transactions Mobile Money régulières",
        "Aucun incident de paiement détecté"
      ]
    }
  },
  {
    id: "precheck",
    name: "Pre-Check",
    method: "POST",
    path: "/v1/precheck",
    price: "2 500 FCFA",
    fields: [
      { name: "phone_number", label: "Numéro de téléphone", placeholder: "+221 77 123 45 67", required: true },
      { name: "full_name", label: "Nom complet", placeholder: "Amadou Diallo", required: true },
    ],
    mockResponse: {
      success: true,
      quick_score: 72,
      sim_stability: "high",
      eligible: true,
      processing_time_ms: 423
    }
  },
  {
    id: "business",
    name: "Business Score",
    method: "POST",
    path: "/v1/business",
    price: "10 000 FCFA",
    fields: [
      { name: "phone_number", label: "Téléphone du gérant", placeholder: "+221 77 123 45 67", required: true },
      { name: "company_name", label: "Nom de l'entreprise", placeholder: "Chez Fatou SARL", required: true },
      { name: "sector", label: "Secteur d'activité", placeholder: "Commerce de détail", required: false },
      { name: "years_in_business", label: "Années d'activité", placeholder: "3", required: false, type: "number" },
    ],
    mockResponse: {
      success: true,
      business_score: 81,
      grade: "B+",
      revenue_stability: 78,
      payment_history: 85,
      growth_potential: 74,
      risk_level: "low",
      recommended_credit_limit: 2500000,
      currency: "FCFA",
      processing_time_ms: 2156
    }
  },
  {
    id: "fraud",
    name: "Fraud Shield",
    method: "POST",
    path: "/v1/fraud",
    price: "7 500 FCFA",
    fields: [
      { name: "phone_number", label: "Numéro de téléphone", placeholder: "+221 77 123 45 67", required: true },
      { name: "full_name", label: "Nom complet", placeholder: "Amadou Diallo", required: true },
      { name: "national_id", label: "Numéro CNI", placeholder: "CI-123456789", required: false },
    ],
    mockResponse: {
      success: true,
      fraud_score: 12,
      risk_level: "very_low",
      identity_coherence: 94,
      behavior_coherence: 91,
      anomalies_count: 0,
      flags: [],
      recommendation: "APPROVE",
      processing_time_ms: 1543
    }
  },
  {
    id: "rbi",
    name: "RBI Score",
    method: "POST",
    path: "/v1/rbi",
    price: "5 000 FCFA",
    fields: [
      { name: "phone_number", label: "Numéro de téléphone", placeholder: "+221 77 123 45 67", required: true },
      { name: "full_name", label: "Nom complet", placeholder: "Amadou Diallo", required: true },
    ],
    mockResponse: {
      success: true,
      rbi_score: 7.8,
      rbi_grade: "B+",
      payment_punctuality: 82,
      commitment_respect: 79,
      financial_discipline: 75,
      trend: "stable",
      processing_time_ms: 1287
    }
  }
];

export const ApiPlayground = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("score");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRequest, setShowRequest] = useState(true);

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint)!;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
    setFormData({});
    setResponse(null);
  };

  const generateCurl = () => {
    const body = currentEndpoint.fields.reduce((acc, field) => {
      if (formData[field.name]) {
        acc[field.name] = field.type === "number" ? parseInt(formData[field.name]) : formData[field.name];
      }
      return acc;
    }, {} as Record<string, unknown>);

    return `curl -X ${currentEndpoint.method} https://api.wouaka-creditscore.com${currentEndpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`;
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponse(null);
    
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Return mock response with some variation
    const mockResponse = { ...currentEndpoint.mockResponse };
    if ('processing_time_ms' in mockResponse) {
      mockResponse.processing_time_ms = Math.floor(800 + Math.random() * 1500);
    }
    
    setResponse(mockResponse);
    setIsLoading(false);
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasRequiredFields = currentEndpoint.fields
    .filter(f => f.required)
    .every(f => formData[f.name]?.trim());

  return (
    <Card className="overflow-hidden border-2 border-secondary/20">
      <CardHeader className="bg-gradient-to-r from-[#1c3d5a] to-[#2a5478] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">API Playground</CardTitle>
              <p className="text-sm text-white/70">Testez notre API sans inscription</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              Mode démo
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Panel - Request */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Endpoint Selector */}
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map(endpoint => (
                      <SelectItem key={endpoint.id} value={endpoint.id}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {endpoint.method}
                          </Badge>
                          <span>{endpoint.name}</span>
                          <span className="text-muted-foreground text-xs">({endpoint.price})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* URL Display */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                  {currentEndpoint.method}
                </Badge>
                <span className="text-muted-foreground truncate">
                  https://api.wouaka-creditscore.com{currentEndpoint.path}
                </span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <Label className="text-muted-foreground">Paramètres</Label>
                {currentEndpoint.fields.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-sm flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field.name}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Execute Button */}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleExecute}
                disabled={isLoading || !hasRequiredFields}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exécution...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Exécuter la requête
                  </>
                )}
              </Button>

              {/* cURL Preview */}
              <Collapsible open={showRequest} onOpenChange={setShowRequest}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                    <span className="text-sm">Voir la requête cURL</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showRequest ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-slate-900 rounded-lg p-4 mt-2 overflow-x-auto">
                    <pre className="text-slate-300 text-xs font-mono whitespace-pre-wrap">
                      {generateCurl()}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Right Panel - Response */}
          <div className="p-6 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-muted-foreground">Réponse</Label>
              {response && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  onClick={copyResponse}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copier
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="bg-slate-900 rounded-lg min-h-[400px] p-4 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[360px]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Traitement en cours...</p>
                  </div>
                </div>
              ) : response ? (
                <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[360px]">
                  <div className="text-center text-slate-500">
                    <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Remplissez les champs et cliquez sur "Exécuter"</p>
                    <p className="text-xs mt-1 opacity-60">La réponse s'affichera ici</p>
                  </div>
                </div>
              )}
            </div>

            {response && (
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Status: <span className="text-green-500 font-medium">200 OK</span></span>
                <span>Temps: <span className="text-secondary font-medium">{(response as any).processing_time_ms || 0}ms</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-secondary/5 border-t">
          <p className="text-xs text-muted-foreground text-center">
            🧪 <strong>Mode démo :</strong> Les données retournées sont simulées. 
            <a href="/auth" className="text-secondary hover:underline ml-1">Créez un compte</a> pour tester avec de vraies données.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
