import { useState } from "react";
import { 
  Code2, 
  Copy, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  FileJson,
  Download,
  ExternalLink,
  Lock,
  Zap,
  Shield,
  Server,
  Key,
  Webhook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { openApiSpec, openApiSpecJson } from "@/lib/openapi-spec";

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
};

const tagIcons: Record<string, React.ElementType> = {
  "W-SCORE": Zap,
  "W-KYC": Shield,
  "WOUAKA CORE": Server,
  "Webhooks": Webhook
};

const ApiDocs = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [openEndpoints, setOpenEndpoints] = useState<string[]>([]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadSpec = () => {
    const blob = new Blob([openApiSpecJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wouaka-api-openapi.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleEndpoint = (id: string) => {
    setOpenEndpoints(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  // Group endpoints by tag
  const endpointsByTag: Record<string, Array<{ path: string; method: string; operation: any }>> = {};
  
  Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
    Object.entries(methods as Record<string, any>).forEach(([method, operation]) => {
      const tag = operation.tags?.[0] || "Other";
      if (!endpointsByTag[tag]) {
        endpointsByTag[tag] = [];
      }
      endpointsByTag[tag].push({ path, method: method.toUpperCase(), operation });
    });
  });

  return (
    <>
      <SEOHead
        title="Référence API OpenAPI"
        description="Documentation OpenAPI/Swagger complète pour l'API Wouaka - scoring de crédit et vérification d'identité pour l'Afrique de l'Ouest."
        canonical="/api-reference"
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileJson className="h-8 w-8 text-primary" />
                API Reference
              </h1>
              <p className="text-muted-foreground mt-1">
                OpenAPI 3.1.0 • Version {openApiSpec.info.version}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadSpec}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger OpenAPI
              </Button>
              <Button variant="outline" asChild>
                <a href="/developer" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Portail Développeur
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Table of Contents */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav className="space-y-1">
                    {Object.entries(endpointsByTag).map(([tag, endpoints]) => {
                      const TagIcon = tagIcons[tag] || Code2;
                      return (
                        <div key={tag} className="space-y-1">
                          <div className="flex items-center gap-2 py-2 text-sm font-medium text-foreground">
                            <TagIcon className="h-4 w-4 text-primary" />
                            {tag}
                          </div>
                          {endpoints.map(({ path, method, operation }) => (
                            <a
                              key={`${method}-${path}`}
                              href={`#${operation.operationId}`}
                              className="flex items-center gap-2 py-1.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                              <Badge variant="outline" className={`text-xs px-1.5 ${methodColors[method]}`}>
                                {method}
                              </Badge>
                              <span className="truncate">{operation.summary}</span>
                            </a>
                          ))}
                        </div>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* API Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{openApiSpec.info.title}</CardTitle>
                  <CardDescription className="whitespace-pre-line">
                    {openApiSpec.info.description.split('\n').slice(0, 5).join('\n')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Base URL</span>
                      </div>
                      <code className="text-xs bg-background px-2 py-1 rounded break-all">
                        {openApiSpec.servers[0].url}
                      </code>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Authentification</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">API Key</Badge>
                        <Badge variant="secondary" className="text-xs">Bearer JWT</Badge>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Header</span>
                      </div>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        x-api-key: wk_live_...
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endpoints by Tag */}
              {Object.entries(endpointsByTag).map(([tag, endpoints]) => {
                const TagIcon = tagIcons[tag] || Code2;
                const tagInfo = openApiSpec.tags.find(t => t.name === tag);
                
                return (
                  <div key={tag} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">{tag}</h2>
                      {tagInfo && (
                        <span className="text-sm text-muted-foreground">
                          — {tagInfo.description}
                        </span>
                      )}
                    </div>

                    {endpoints.map(({ path, method, operation }) => {
                      const endpointId = operation.operationId;
                      const isOpen = openEndpoints.includes(endpointId);
                      
                      return (
                        <Card key={endpointId} id={endpointId} className="scroll-mt-4">
                          <Collapsible open={isOpen} onOpenChange={() => toggleEndpoint(endpointId)}>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge className={methodColors[method]}>
                                      {method}
                                    </Badge>
                                    <code className="text-sm font-mono">{path}</code>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground hidden md:inline">
                                      {operation.summary}
                                    </span>
                                    {isOpen ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </div>
                                </div>
                                <CardDescription className="md:hidden mt-2">
                                  {operation.summary}
                                </CardDescription>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="border-t pt-4">
                                <Tabs defaultValue="description" className="w-full">
                                  <TabsList>
                                    <TabsTrigger value="description">Description</TabsTrigger>
                                    <TabsTrigger value="request">Request</TabsTrigger>
                                    <TabsTrigger value="response">Response</TabsTrigger>
                                    <TabsTrigger value="curl">cURL</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="description" className="mt-4">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <div className="whitespace-pre-line text-sm text-muted-foreground">
                                        {operation.description}
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="request" className="mt-4">
                                    {operation.requestBody?.content?.["application/json"]?.examples && (
                                      <div className="space-y-4">
                                        {Object.entries(operation.requestBody.content["application/json"].examples).map(
                                          ([name, example]: [string, any]) => (
                                            <div key={name}>
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{example.summary}</span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => copyToClipboard(
                                                    JSON.stringify(example.value, null, 2),
                                                    `req-${endpointId}-${name}`
                                                  )}
                                                >
                                                  {copied === `req-${endpointId}-${name}` ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                  ) : (
                                                    <Copy className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              </div>
                                              <ScrollArea className="h-[300px]">
                                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                                                  {JSON.stringify(example.value, null, 2)}
                                                </pre>
                                              </ScrollArea>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent value="response" className="mt-4">
                                    {operation.responses?.["200"]?.content?.["application/json"]?.example && (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant="outline" className="text-green-600">
                                            200 OK
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(
                                              JSON.stringify(
                                                operation.responses["200"].content["application/json"].example,
                                                null,
                                                2
                                              ),
                                              `res-${endpointId}`
                                            )}
                                          >
                                            {copied === `res-${endpointId}` ? (
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <ScrollArea className="h-[400px]">
                                          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                                            {JSON.stringify(
                                              operation.responses["200"].content["application/json"].example,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        </ScrollArea>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent value="curl" className="mt-4">
                                    {(() => {
                                      const example = operation.requestBody?.content?.["application/json"]?.examples?.minimal?.value ||
                                        operation.requestBody?.content?.["application/json"]?.examples?.basic?.value ||
                                        {};
                                      const curl = `curl -X ${method} "${openApiSpec.servers[0].url}${path}" \\
  -H "x-api-key: wk_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(example, null, 2)}'`;
                                      
                                      return (
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">cURL Example</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => copyToClipboard(curl, `curl-${endpointId}`)}
                                            >
                                              {copied === `curl-${endpointId}` ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <Copy className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                                            {curl}
                                          </pre>
                                        </div>
                                      );
                                    })()}
                                  </TabsContent>
                                </Tabs>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}

              {/* Schemas Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Schemas / Models
                  </CardTitle>
                  <CardDescription>
                    Structures de données utilisées par l'API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.keys(openApiSpec.components.schemas).map((schemaName) => (
                      <div
                        key={schemaName}
                        className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          const schema = openApiSpec.components.schemas[schemaName as keyof typeof openApiSpec.components.schemas];
                          copyToClipboard(JSON.stringify(schema, null, 2), `schema-${schemaName}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono">{schemaName}</code>
                          {copied === `schema-${schemaName}` ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ApiDocs;
