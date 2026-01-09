import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Database, 
  Server, 
  Shield, 
  Cpu, 
  Globe, 
  Code,
  FileCode,
  Users,
  Webhook,
  CreditCard,
  FileCheck,
  BarChart3,
  Building2,
  Key,
  Layers,
  GitBranch,
  Package,
  Terminal
} from "lucide-react";
import { Link } from "react-router-dom";

const FullArchitecture = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Architecture Industrielle</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/prisma-schema">
              <Button variant="outline" size="sm">Schéma Prisma</Button>
            </Link>
            <Link to="/file-structure">
              <Button variant="outline" size="sm">Structure Fichiers</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="max-w-4xl mx-auto mb-12">
          <Badge variant="score" className="mb-4">Architecture Industrielle</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Wouaka Credit Score
          </h1>
          <p className="text-lg text-muted-foreground">
            Architecture SaaS complète, portable et souveraine pour la notation de crédit en Afrique de l'Ouest.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Vue Globale
            </TabsTrigger>
            <TabsTrigger value="backend" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Backend
            </TabsTrigger>
            <TabsTrigger value="frontend" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Frontend
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Données
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              APIs
            </TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Déploiement
            </TabsTrigger>
          </TabsList>

          {/* Vue Globale */}
          <TabsContent value="overview" className="space-y-8">
            {/* Architecture Diagram */}
            <Card variant="premium" className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Diagramme d'Architecture Globale
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="bg-primary/5 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                  <pre className="text-foreground whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                               │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐│
│  │   Web App      │ │  Mobile PWA    │ │   SDK Client   │ │   Partenaires (Webhooks)   ││
│  │   (React+Vite) │ │   (React)      │ │   (TypeScript) │ │   (REST Callbacks)         ││
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └──────────────┬─────────────┘│
└──────────┼──────────────────┼──────────────────┼────────────────────────┼──────────────┘
           │                  │                  │                        │
           └──────────────────┴─────────┬────────┴────────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Kong / Traefik)                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │Rate Limiting │ │ JWT Verify   │ │ CORS Policy  │ │Load Balancer │ │ SSL/TLS      │  │
│  │(100 req/min) │ │ + RBAC       │ │              │ │ (Round Robin)│ │ Termination  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND MICROSERVICES (NestJS + Node.js)                        │
│                                                                                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │  AUTH SERVICE    │ │   KYC SERVICE    │ │ SCORING SERVICE  │ │  DATA SERVICE    │    │
│  │  ───────────     │ │   ───────────    │ │  ───────────     │ │  ───────────     │    │
│  │  • JWT/Refresh   │ │  • Doc Upload    │ │  • TensorFlow.js │ │  • PISPI BCEAO   │    │
│  │  • RBAC (4 rôles)│ │  • Tesseract OCR │ │  • Score Calc    │ │  • Télécom APIs  │    │
│  │  • Sessions      │ │  • spaCy NLP     │ │  • LIME/SHAP     │ │  • RCCM/OpenData │    │
│  │  • 2FA (optionnel│ │  • Validation    │ │  • Model Mgmt    │ │  • CSV/Excel     │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │MARKETPLACE SERV. │ │ BILLING SERVICE  │ │ WEBHOOK SERVICE  │ │  AUDIT SERVICE   │    │
│  │  ───────────     │ │  ───────────     │ │  ───────────     │ │  ───────────     │    │
│  │  • Products List │ │  • Invoice Ninja │ │  • Event Queue   │ │  • Activity Logs │    │
│  │  • Applications  │ │  • Subscriptions │ │  • Retry Logic   │ │  • Compliance    │    │
│  │  • Matching      │ │  • Usage Metering│ │  • Signatures    │ │  • RGPD Export   │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                                          │
│  ┌──────────────────┐ ┌──────────────────┐                                               │
│  │NOTIFICATION SERV.│ │  REPORT SERVICE  │                                               │
│  │  ───────────     │ │  ───────────     │                                               │
│  │  • Email (SMTP)  │ │  • PDF Generation│                                               │
│  │  • SMS (Twilio)  │ │  • Analytics     │                                               │
│  │  • Push          │ │  • Exports       │                                               │
│  └──────────────────┘ └──────────────────┘                                               │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               AI / ML PROCESSING LAYER                                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │  TensorFlow.js   │ │   Tesseract.js   │ │   spaCy (Python) │ │   ONNX Runtime   │    │
│  │  ───────────     │ │   ───────────    │ │   ───────────    │ │   ───────────    │    │
│  │  • Credit Model  │ │  • CNI/Passport  │ │  • Entity Extract│ │  • Fast Inference│    │
│  │  • Risk Predict  │ │  • Utility Bills │ │  • Normalize     │ │  • Model Export  │    │
│  │  • Feature Eng.  │ │  • Bank Stmts    │ │  • Sentiment     │ │  • Quantization  │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                                          │
│  ┌──────────────────┐ ┌──────────────────┐                                               │
│  │   LIME / SHAP    │ │  Model Registry  │       ┌─────────────────────────────────┐    │
│  │   ───────────    │ │  ───────────     │       │      Bull Queue (Redis)         │    │
│  │  • Explainability│ │  • Version Ctrl  │       │  • OCR Jobs • Scoring Jobs      │    │
│  │  • Feature Import│ │  • A/B Testing   │       │  • Webhook Jobs • Reports       │    │
│  └──────────────────┘ └──────────────────┘       └─────────────────────────────────┘    │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA LAYER                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │   PostgreSQL 15  │ │   Redis 7        │ │   MinIO (S3)     │ │  TimescaleDB     │    │
│  │   ───────────    │ │   ───────────    │ │   ───────────    │ │  ───────────     │    │
│  │  • Main Database │ │  • Sessions      │ │  • Documents     │ │  • Time-series   │    │
│  │  • Prisma ORM    │ │  • Cache         │ │  • OCR Images    │ │  • Analytics     │    │
│  │  • Full-text     │ │  • Rate Limits   │ │  • Reports       │ │  • Metrics       │    │
│  │  • Row-level Sec.│ │  • Job Queues    │ │  • Backups       │ │  • Audit Trail   │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Stack Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Globe, title: "Frontend", tech: "React 18 + Vite + TypeScript + TailwindCSS" },
                { icon: Server, title: "Backend", tech: "NestJS 10 + Node.js 20 LTS + Prisma" },
                { icon: Database, title: "Database", tech: "PostgreSQL 15 + Redis 7 + TimescaleDB" },
                { icon: Cpu, title: "AI/ML", tech: "TensorFlow.js + Tesseract + spaCy" },
              ].map((item, i) => (
                <Card key={i} variant="stat">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.tech}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Roles RBAC */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Système RBAC - 4 Rôles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      role: "SUPER_ADMIN",
                      label: "Super Admin",
                      color: "bg-destructive",
                      perms: ["Gestion système", "Config IA", "Tous les accès", "Audit logs"],
                    },
                    {
                      role: "ANALYST",
                      label: "Analyste/Partenaire",
                      color: "bg-warning",
                      perms: ["Validation KYC", "Lecture scores", "Rapports", "Dossiers"],
                    },
                    {
                      role: "COMPANY",
                      label: "Entreprise",
                      color: "bg-info",
                      perms: ["Demande scoring", "Suivi dossiers", "Factures", "Webhooks"],
                    },
                    {
                      role: "API_CLIENT",
                      label: "Client API (M2M)",
                      color: "bg-success",
                      perms: ["API REST", "Batch scoring", "Webhooks", "SDK access"],
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/50 bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-mono text-xs text-muted-foreground">{item.role}</span>
                      </div>
                      <div className="font-semibold mb-2">{item.label}</div>
                      <ul className="space-y-1">
                        {item.perms.map((p, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-accent" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Modules Principaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: FileCheck, name: "KYC Module", desc: "Upload documents, OCR Tesseract, validation manuelle, spaCy NLP" },
                    { icon: BarChart3, name: "Scoring Module", desc: "TensorFlow.js, calcul score, LIME/SHAP explicabilité" },
                    { icon: Database, name: "Data Import", desc: "CSV/Excel import, PISPI BCEAO, télécom, RCCM, OpenData" },
                    { icon: Building2, name: "Marketplace", desc: "Produits financiers, matching, applications" },
                    { icon: CreditCard, name: "Billing", desc: "Invoice Ninja, abonnements, usage metering" },
                    { icon: Webhook, name: "Webhooks", desc: "Events: score-ready, kyc-complete, application-status" },
                    { icon: Shield, name: "Audit & Logs", desc: "Activity tracking, RGPD compliance, exports" },
                    { icon: Key, name: "API Gateway", desc: "Rate limiting, JWT auth, API keys, versioning" },
                    { icon: FileCode, name: "Reports", desc: "PDF generation, analytics, dashboards export" },
                  ].map((mod, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <mod.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{mod.name}</div>
                        <div className="text-xs text-muted-foreground">{mod.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backend Tab */}
          <TabsContent value="backend" className="space-y-8">
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Microservices NestJS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Service</th>
                        <th className="text-left p-3 font-semibold">Port</th>
                        <th className="text-left p-3 font-semibold">Responsabilités</th>
                        <th className="text-left p-3 font-semibold">Dépendances</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { name: "api-gateway", port: "3000", resp: "Routing, Auth, Rate Limiting, CORS", deps: "Redis, Auth Service" },
                        { name: "auth-service", port: "3001", resp: "JWT, Refresh Tokens, RBAC, Sessions", deps: "PostgreSQL, Redis" },
                        { name: "kyc-service", port: "3002", resp: "Document Upload, OCR, Validation", deps: "MinIO, Tesseract, spaCy" },
                        { name: "scoring-service", port: "3003", resp: "Score Calculation, ML Models, Explain", deps: "TensorFlow.js, LIME" },
                        { name: "data-service", port: "3004", resp: "Data Import, External APIs, Sync", deps: "PostgreSQL, Bull Queue" },
                        { name: "marketplace-service", port: "3005", resp: "Products, Applications, Matching", deps: "PostgreSQL" },
                        { name: "billing-service", port: "3006", resp: "Invoices, Subscriptions, Payments", deps: "Invoice Ninja API" },
                        { name: "webhook-service", port: "3007", resp: "Event Dispatch, Retry Logic", deps: "Redis, Bull Queue" },
                        { name: "audit-service", port: "3008", resp: "Logs, Compliance, RGPD", deps: "TimescaleDB" },
                        { name: "notification-service", port: "3009", resp: "Email, SMS, Push", deps: "SMTP, Twilio" },
                      ].map((svc, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="p-3 font-mono text-primary">{svc.name}</td>
                          <td className="p-3"><code className="bg-muted px-2 py-0.5 rounded text-xs">{svc.port}</code></td>
                          <td className="p-3 text-muted-foreground">{svc.resp}</td>
                          <td className="p-3 text-xs text-muted-foreground">{svc.deps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* NestJS Module Structure */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle>Structure Module NestJS (exemple auth-service)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                  <pre>
{`services/auth-service/
├── src/
│   ├── main.ts                    # Bootstrap NestJS
│   ├── app.module.ts              # Root module
│   ├── config/
│   │   ├── configuration.ts       # Environment config
│   │   └── validation.schema.ts   # Joi validation
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts     # /auth endpoints
│   │   ├── auth.service.ts        # Business logic
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts    # JWT passport strategy
│   │   │   ├── refresh.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts     # RBAC guard
│   │   │   └── throttle.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── refresh-token.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.repository.ts    # Prisma queries
│   ├── roles/
│   │   ├── roles.module.ts
│   │   ├── roles.service.ts
│   │   └── role.enum.ts
│   └── common/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       ├── interceptors/
│       │   └── logging.interceptor.ts
│       └── pipes/
│           └── validation.pipe.ts
├── prisma/
│   └── schema.prisma
├── test/
│   └── auth.e2e-spec.ts
├── Dockerfile
├── package.json
└── tsconfig.json`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frontend Tab */}
          <TabsContent value="frontend" className="space-y-8">
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Structure Frontend React + Vite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                  <pre>
{`frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                      # TailwindCSS + Design tokens
│   │
│   ├── config/
│   │   ├── api.config.ts              # API endpoints
│   │   └── constants.ts               # App constants
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── api-client.ts              # Axios instance
│   │   └── auth.ts                    # Auth utilities
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                # Auth state hook
│   │   ├── use-api.ts                 # React Query hooks
│   │   ├── use-score.ts
│   │   └── use-websocket.ts
│   │
│   ├── stores/
│   │   ├── auth.store.ts              # Zustand auth store
│   │   └── ui.store.ts
│   │
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── score.types.ts
│   │   ├── kyc.types.ts
│   │   └── api.types.ts
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── kyc/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── OCRPreview.tsx
│   │   │   └── ValidationForm.tsx
│   │   ├── scoring/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── ScoreGauge.tsx
│   │   │   ├── FactorsList.tsx
│   │   │   └── ExplainabilityChart.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentScores.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── Charts/
│   │   └── marketplace/
│   │       ├── ProductCard.tsx
│   │       ├── ApplicationForm.tsx
│   │       └── ProductFilter.tsx
│   │
│   └── pages/
│       ├── public/
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   └── ForgotPassword.tsx
│       │
│       ├── dashboard/
│       │   ├── Overview.tsx           # Dashboard principal
│       │   ├── Analytics.tsx
│       │   └── Settings.tsx
│       │
│       ├── kyc/
│       │   ├── KYCList.tsx
│       │   ├── KYCSubmit.tsx
│       │   ├── KYCDetail.tsx
│       │   └── KYCValidation.tsx      # Pour Analysts
│       │
│       ├── scoring/
│       │   ├── ScoreRequest.tsx
│       │   ├── ScoreResults.tsx
│       │   ├── ScoreHistory.tsx
│       │   └── ScoreDetail.tsx
│       │
│       ├── data/
│       │   ├── DataSources.tsx
│       │   ├── ImportData.tsx
│       │   └── DataMapping.tsx
│       │
│       ├── marketplace/
│       │   ├── Products.tsx
│       │   ├── ProductDetail.tsx
│       │   ├── MyApplications.tsx
│       │   └── ApplicationDetail.tsx
│       │
│       ├── billing/
│       │   ├── Subscriptions.tsx
│       │   ├── Invoices.tsx
│       │   └── Usage.tsx
│       │
│       ├── admin/                     # Super Admin only
│       │   ├── Users.tsx
│       │   ├── Organizations.tsx
│       │   ├── Models.tsx
│       │   ├── AuditLogs.tsx
│       │   └── SystemConfig.tsx
│       │
│       └── api/                       # API Client pages
│           ├── APIKeys.tsx
│           ├── Documentation.tsx
│           └── Webhooks.tsx
│
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Pages par Rôle */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle>Pages par Rôle Utilisateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      role: "Super Admin",
                      pages: [
                        "/admin/dashboard - Vue système complète",
                        "/admin/users - Gestion utilisateurs",
                        "/admin/organizations - Gestion organisations",
                        "/admin/models - Configuration modèles IA",
                        "/admin/audit - Logs d'audit complets",
                        "/admin/config - Configuration système",
                        "/admin/billing - Gestion facturation globale",
                      ],
                    },
                    {
                      role: "Analyste/Partenaire",
                      pages: [
                        "/dashboard - Vue analytique",
                        "/kyc/pending - Dossiers à valider",
                        "/kyc/validated - Historique validations",
                        "/scores/all - Consultation scores",
                        "/reports - Rapports & exports",
                        "/marketplace/manage - Gestion produits",
                      ],
                    },
                    {
                      role: "Entreprise",
                      pages: [
                        "/dashboard - Mon tableau de bord",
                        "/kyc/submit - Soumettre un dossier",
                        "/kyc/my-requests - Mes demandes KYC",
                        "/scores/request - Demander un score",
                        "/scores/history - Historique scores",
                        "/marketplace - Produits disponibles",
                        "/billing - Mes factures",
                        "/settings - Paramètres compte",
                      ],
                    },
                    {
                      role: "Client API",
                      pages: [
                        "/api/dashboard - Statistiques API",
                        "/api/keys - Gestion clés API",
                        "/api/documentation - Doc interactive",
                        "/api/webhooks - Configuration webhooks",
                        "/api/usage - Consommation & quotas",
                        "/api/logs - Logs requêtes",
                      ],
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/50">
                      <Badge variant="premium" className="mb-3">{item.role}</Badge>
                      <ul className="space-y-1">
                        {item.pages.map((page, j) => (
                          <li key={j} className="text-xs text-muted-foreground font-mono">
                            {page}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-8">
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Sources de Données Intégrées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Public Sources */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-secondary" />
                      Sources Publiques
                    </h3>
                    <div className="space-y-3">
                      {[
                        { 
                          name: "BCEAO PISPI", 
                          url: "https://www.bceao.int/pispi", 
                          data: "Annuaire des PSF agréés, statuts, sanctions",
                          freq: "Quotidien"
                        },
                        { 
                          name: "OpenStreetMap Nominatim", 
                          url: "nominatim.openstreetmap.org", 
                          data: "Géocodage, validation adresses",
                          freq: "Temps réel"
                        },
                        { 
                          name: "Open Data UEMOA", 
                          url: "data.uemoa.int", 
                          data: "Statistiques économiques régionales",
                          freq: "Mensuel"
                        },
                        { 
                          name: "World Bank Open Data", 
                          url: "data.worldbank.org", 
                          data: "Indicateurs macro-économiques",
                          freq: "Annuel"
                        },
                        { 
                          name: "FAO STAT", 
                          url: "fao.org/faostat", 
                          data: "Prix agricoles, production",
                          freq: "Mensuel"
                        },
                      ].map((src, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{src.name}</span>
                            <Badge variant="glass" className="text-xs">{src.freq}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">{src.data}</div>
                          <code className="text-xs text-primary/70">{src.url}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Partner Sources */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-warning" />
                      Sources Partenaires (API)
                    </h3>
                    <div className="space-y-3">
                      {[
                        { 
                          name: "MTN Mobile Money", 
                          data: "Historique transactions, solde moyen, fréquence",
                          auth: "OAuth2 + API Key"
                        },
                        { 
                          name: "Orange Money", 
                          data: "Transactions P2P, paiements marchands",
                          auth: "OAuth2 + API Key"
                        },
                        { 
                          name: "RCCM National", 
                          data: "Registre commerce, statuts entreprises",
                          auth: "API Key + Certificat"
                        },
                        { 
                          name: "Direction Impôts", 
                          data: "Statut fiscal, déclarations",
                          auth: "Partenariat institutionnel"
                        },
                        { 
                          name: "Compagnies d'électricité", 
                          data: "Historique paiements, consommation",
                          auth: "API B2B"
                        },
                      ].map((src, i) => (
                        <div key={i} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div className="font-medium text-sm mb-1">{src.name}</div>
                          <div className="text-xs text-muted-foreground mb-1">{src.data}</div>
                          <Badge variant="outline" className="text-xs">{src.auth}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Formats */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle>Formats d'Import Supportés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { format: "CSV", desc: "Délimiteur configurable, encodage UTF-8/Latin1" },
                    { format: "Excel (.xlsx)", desc: "Multi-feuilles, mapping colonnes" },
                    { format: "JSON", desc: "Nested objects, arrays" },
                    { format: "XML", desc: "XPath mapping" },
                  ].map((f, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 text-center">
                      <div className="font-mono font-bold text-lg text-primary mb-1">{f.format}</div>
                      <div className="text-xs text-muted-foreground">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Internal API */}
              <Card variant="premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    API Interne (Inter-services)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="font-medium mb-2">Auth Service</div>
                      <code className="block text-xs text-muted-foreground">POST /internal/auth/validate-token</code>
                      <code className="block text-xs text-muted-foreground">POST /internal/auth/check-permission</code>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="font-medium mb-2">Scoring Service</div>
                      <code className="block text-xs text-muted-foreground">POST /internal/score/calculate</code>
                      <code className="block text-xs text-muted-foreground">GET /internal/score/model-status</code>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="font-medium mb-2">Data Service</div>
                      <code className="block text-xs text-muted-foreground">GET /internal/data/subject/:id</code>
                      <code className="block text-xs text-muted-foreground">POST /internal/data/sync</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Public API */}
              <Card variant="premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-secondary" />
                    API Publique (Partenaires)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <div className="font-medium mb-2">Authentication</div>
                      <code className="block text-xs text-muted-foreground">POST /api/v1/auth/token</code>
                      <code className="block text-xs text-muted-foreground">POST /api/v1/auth/refresh</code>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <div className="font-medium mb-2">Scoring</div>
                      <code className="block text-xs text-muted-foreground">POST /api/v1/score/request</code>
                      <code className="block text-xs text-muted-foreground">GET /api/v1/score/:id</code>
                      <code className="block text-xs text-muted-foreground">GET /api/v1/score/:id/explain</code>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <div className="font-medium mb-2">KYC</div>
                      <code className="block text-xs text-muted-foreground">POST /api/v1/kyc/submit</code>
                      <code className="block text-xs text-muted-foreground">GET /api/v1/kyc/:id/status</code>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <div className="font-medium mb-2">Webhooks</div>
                      <code className="block text-xs text-muted-foreground">POST /api/v1/webhooks</code>
                      <code className="block text-xs text-muted-foreground">DELETE /api/v1/webhooks/:id</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Webhook Events */}
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-accent" />
                  Événements Webhook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { event: "score.calculated", desc: "Score calculé et disponible" },
                    { event: "score.expired", desc: "Score expiré (> 90 jours)" },
                    { event: "kyc.submitted", desc: "Dossier KYC soumis" },
                    { event: "kyc.validated", desc: "KYC validé par analyste" },
                    { event: "kyc.rejected", desc: "KYC rejeté" },
                    { event: "application.status", desc: "Changement statut demande" },
                  ].map((wh, i) => (
                    <div key={i} className="p-3 rounded-lg border border-accent/20 bg-accent/5">
                      <code className="text-xs font-bold text-accent">{wh.event}</code>
                      <div className="text-xs text-muted-foreground mt-1">{wh.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-8">
            <Card variant="premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Setup & Déploiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prerequisites */}
                <div>
                  <h3 className="font-semibold mb-3">Prérequis Serveur</h3>
                  <div className="grid md:grid-cols-4 gap-3">
                    {[
                      { name: "Ubuntu 22.04 LTS", spec: "ou Debian 12" },
                      { name: "Docker 24+", spec: "avec Docker Compose" },
                      { name: "8 GB RAM", spec: "minimum (16 GB recommandé)" },
                      { name: "100 GB SSD", spec: "stockage" },
                    ].map((req, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                        <div className="font-medium text-sm">{req.name}</div>
                        <div className="text-xs text-muted-foreground">{req.spec}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Docker Compose */}
                <div>
                  <h3 className="font-semibold mb-3">docker-compose.yml (simplifié)</h3>
                  <div className="bg-primary/5 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <pre>
{`version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: wouaka
      POSTGRES_USER: wouaka
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: \${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=\${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - auth-service

  # Microservices
  auth-service:
    build: ./services/auth-service
    environment:
      - DATABASE_URL=postgresql://wouaka:\${DB_PASSWORD}@postgres:5432/wouaka
      - JWT_SECRET=\${JWT_SECRET}
    depends_on:
      - postgres

  kyc-service:
    build: ./services/kyc-service
    environment:
      - DATABASE_URL=postgresql://wouaka:\${DB_PASSWORD}@postgres:5432/wouaka
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - postgres
      - minio

  scoring-service:
    build: ./services/scoring-service
    environment:
      - DATABASE_URL=postgresql://wouaka:\${DB_PASSWORD}@postgres:5432/wouaka
    depends_on:
      - postgres
      - redis

  # ... autres services

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api-gateway

volumes:
  postgres_data:
  minio_data:`}
                    </pre>
                  </div>
                </div>

                {/* Quick Start */}
                <div>
                  <h3 className="font-semibold mb-3">Quick Start</h3>
                  <div className="bg-primary/5 rounded-xl p-4 font-mono text-xs space-y-2">
                    <div className="text-muted-foreground"># 1. Clone le repository</div>
                    <code>git clone https://github.com/wouaka/credit-score.git</code>
                    <div className="text-muted-foreground mt-4"># 2. Copier et configurer .env</div>
                    <code>cp .env.example .env && nano .env</code>
                    <div className="text-muted-foreground mt-4"># 3. Lancer les services</div>
                    <code>docker-compose up -d</code>
                    <div className="text-muted-foreground mt-4"># 4. Exécuter les migrations</div>
                    <code>docker-compose exec auth-service npx prisma migrate deploy</code>
                    <div className="text-muted-foreground mt-4"># 5. Créer le Super Admin</div>
                    <code>docker-compose exec auth-service npm run seed:admin</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-12">
          <Link to="/prisma-schema">
            <Button variant="hero">
              <FileCode className="w-4 h-4 mr-2" />
              Voir le Schéma Prisma
            </Button>
          </Link>
          <Link to="/file-structure">
            <Button variant="outline">
              <GitBranch className="w-4 h-4 mr-2" />
              Structure Complète
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FullArchitecture;
