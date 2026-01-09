import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Server, Shield, Cpu, Globe, Code } from "lucide-react";
import { Link } from "react-router-dom";

const Architecture = () => {
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
                <span className="text-sm font-bold text-primary-foreground">W</span>
              </div>
              <span className="font-display text-lg font-bold">Architecture Wouaka</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="max-w-4xl mx-auto mb-12">
          <Badge variant="premium" className="mb-4">Documentation Technique</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Architecture Système
          </h1>
          <p className="text-lg text-muted-foreground">
            Vue complète de l'architecture Wouaka Credit Score - SaaS souverain pour la notation de crédit en Afrique de l'Ouest.
          </p>
        </div>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">1. Vue d'ensemble</h2>
          <Card variant="premium" className="p-8">
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-6">
                Wouaka Credit Score est une architecture microservices conçue pour être <strong className="text-foreground">100% portable</strong> et déployable sur infrastructure privée. Elle utilise exclusivement des technologies open source pour éviter toute dépendance propriétaire.
              </p>
              
              {/* Architecture Diagram as ASCII/Text representation */}
              <div className="bg-primary/5 rounded-2xl p-6 font-mono text-sm overflow-x-auto mb-6">
                <pre className="text-foreground">
{`┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Web App  │  │Mobile App│  │ API SDK  │  │ Partenaires (Webhook)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼──────────────┘
        │             │             │                  │
        └─────────────┴──────┬──────┴──────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong/Nginx)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Rate Limiting│  │   Auth JWT   │  │ Load Balancer            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND MICROSERVICES (NestJS)                    │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │   Auth     │ │    KYC     │ │  Scoring   │ │   Data     │        │
│  │  Service   │ │  Service   │ │  Service   │ │  Ingestion │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ Marketplace│ │  Billing   │ │  Webhook   │ │   Audit    │        │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
└─────────────────────────────────────┬───────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI / ML LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ TensorFlow.js│  │   Tesseract  │  │      spaCy (NLP)         │   │
│  │  Scoring AI  │  │     OCR      │  │    Normalisation         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │  LIME/SHAP   │  │ ONNX Runtime │                                 │
│  │ Explicabilité│  │   Inference  │                                 │
│  └──────────────┘  └──────────────┘                                 │
└─────────────────────────────────────┬───────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │   File Storage (MinIO)   │   │
│  │  (Prisma ORM)│  │    Cache     │  │    Documents & Images    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>
          </Card>
        </section>

        {/* Stack Technique */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">2. Stack Technique</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Frontend",
                items: ["React 18 / Next.js 15", "TypeScript", "TailwindCSS", "Recharts", "React Query"],
              },
              {
                icon: Server,
                title: "Backend",
                items: ["Node.js 20 LTS", "NestJS 10", "Prisma ORM", "Bull (Queues)", "Passport.js"],
              },
              {
                icon: Database,
                title: "Base de données",
                items: ["PostgreSQL 15", "Redis 7", "MinIO (S3)", "TimescaleDB (analytics)"],
              },
              {
                icon: Shield,
                title: "Sécurité",
                items: ["JWT + Refresh Tokens", "RBAC (4 rôles)", "Rate Limiting", "Helmet.js"],
              },
              {
                icon: Cpu,
                title: "IA / ML",
                items: ["TensorFlow.js", "Tesseract OCR", "spaCy NLP", "LIME/SHAP", "ONNX Runtime"],
              },
              {
                icon: Code,
                title: "DevOps",
                items: ["Docker", "Docker Compose", "GitHub Actions", "Prometheus/Grafana"],
              },
            ].map((stack, i) => (
              <Card key={i} variant="stat">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <stack.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{stack.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {stack.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles RBAC */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">3. Système RBAC - 4 Rôles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                role: "Super Admin",
                color: "destructive",
                permissions: [
                  "Gestion complète du système",
                  "Configuration des modèles IA",
                  "Gestion des utilisateurs et rôles",
                  "Accès aux logs d'audit",
                  "Configuration des intégrations",
                ],
              },
              {
                role: "Analyste / Partenaire Financier",
                color: "warning",
                permissions: [
                  "Validation manuelle KYC",
                  "Consultation des scores",
                  "Accès aux rapports analytiques",
                  "Gestion des dossiers clients",
                  "Export de données (limité)",
                ],
              },
              {
                role: "Entreprise Demandeuse",
                color: "info",
                permissions: [
                  "Soumission de demandes de scoring",
                  "Suivi de ses propres dossiers",
                  "Accès à ses factures",
                  "Configuration webhooks",
                  "Accès API (quota limité)",
                ],
              },
              {
                role: "Utilisateur Grands Comptes (API)",
                color: "success",
                permissions: [
                  "Accès API illimité",
                  "Webhooks temps réel",
                  "Documentation API dédiée",
                  "Support prioritaire",
                  "SLA garanti",
                ],
              },
            ].map((item, i) => (
              <Card key={i} variant="premium">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.color as any}>{item.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.permissions.map((perm, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-4 h-4 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-accent">✓</span>
                        </div>
                        {perm}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Microservices */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">4. Microservices NestJS</h2>
          <Card variant="premium" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Service</th>
                    <th className="text-left p-4 font-semibold">Responsabilité</th>
                    <th className="text-left p-4 font-semibold">Endpoints Clés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      service: "auth-service",
                      resp: "Authentification, JWT, Refresh tokens, RBAC",
                      endpoints: "/auth/login, /auth/refresh, /auth/register",
                    },
                    {
                      service: "kyc-service",
                      resp: "Validation documents, OCR Tesseract, vérification manuelle",
                      endpoints: "/kyc/upload, /kyc/validate, /kyc/status",
                    },
                    {
                      service: "scoring-service",
                      resp: "Calcul du score IA, explicabilité LIME/SHAP",
                      endpoints: "/score/calculate, /score/explain, /score/history",
                    },
                    {
                      service: "data-ingestion-service",
                      resp: "Import données alternatives, normalisation spaCy",
                      endpoints: "/data/import, /data/sources, /data/sync",
                    },
                    {
                      service: "marketplace-service",
                      resp: "Gestion produits financiers, matching offres",
                      endpoints: "/marketplace/products, /marketplace/match",
                    },
                    {
                      service: "billing-service",
                      resp: "Facturation, abonnements, paiements",
                      endpoints: "/billing/invoices, /billing/subscribe",
                    },
                    {
                      service: "webhook-service",
                      resp: "Notifications partenaires, événements temps réel",
                      endpoints: "/webhooks/register, /webhooks/trigger",
                    },
                    {
                      service: "audit-service",
                      resp: "Logs d'audit, traçabilité, conformité",
                      endpoints: "/audit/logs, /audit/export",
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono text-primary">{row.service}</td>
                      <td className="p-4 text-muted-foreground">{row.resp}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{row.endpoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* External APIs */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">5. APIs Externes & Sources de Données</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="stat">
              <CardHeader>
                <CardTitle className="text-lg">Sources Publiques</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    { name: "BCEAO PISPI", desc: "Annuaire PSF" },
                    { name: "OpenStreetMap Nominatim", desc: "Géocodage" },
                    { name: "RCCM Public API", desc: "Données entreprises" },
                    { name: "Open Data Africa", desc: "Données économiques" },
                    { name: "Weather APIs", desc: "Données météo" },
                  ].map((api, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{api.name}</span>
                      <Badge variant="glass">{api.desc}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardHeader>
                <CardTitle className="text-lg">Partenariats (via accord)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    { name: "MTN Mobile Money", desc: "Données télécom" },
                    { name: "Orange Money", desc: "Données télécom" },
                    { name: "Administrations locales", desc: "Registres" },
                    { name: "Invoice Ninja", desc: "Facturation" },
                    { name: "Stripe (optionnel)", desc: "Paiements" },
                  ].map((api, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{api.name}</span>
                      <Badge variant="premium">{api.desc}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link to="/data-model">
            <Button variant="hero">
              Voir le Modèle de Données
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Architecture;
