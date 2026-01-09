import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderTree, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const FileStructure = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const projectStructure = `wouaka-credit-score/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   └── contributing.md
│
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
│
├── packages/                          # Shared packages (monorepo)
│   ├── eslint-config/
│   ├── typescript-config/
│   └── shared-types/
│       ├── src/
│       │   ├── user.types.ts
│       │   ├── score.types.ts
│       │   ├── kyc.types.ts
│       │   └── index.ts
│       └── package.json
│
├── frontend/                          # React + Vite + TypeScript
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   │
│   │   ├── config/
│   │   │   ├── api.config.ts
│   │   │   ├── routes.config.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── api-client.ts
│   │   │   ├── auth.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-api.ts
│   │   │   ├── use-score.ts
│   │   │   ├── use-kyc.ts
│   │   │   ├── use-websocket.ts
│   │   │   └── use-permissions.ts
│   │   │
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   ├── ui.store.ts
│   │   │   └── notifications.store.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── api-responses.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   └── RoleGuard.tsx
│   │   │   │
│   │   │   ├── kyc/
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentPreview.tsx
│   │   │   │   ├── OCRPreview.tsx
│   │   │   │   ├── ValidationForm.tsx
│   │   │   │   ├── KYCStatusBadge.tsx
│   │   │   │   └── KYCTimeline.tsx
│   │   │   │
│   │   │   ├── scoring/
│   │   │   │   ├── ScoreCard.tsx
│   │   │   │   ├── ScoreGauge.tsx
│   │   │   │   ├── ScoreHistoryChart.tsx
│   │   │   │   ├── FactorsList.tsx
│   │   │   │   ├── FactorBar.tsx
│   │   │   │   ├── ExplainabilityChart.tsx
│   │   │   │   └── ScoreCompare.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── StatsGrid.tsx
│   │   │   │   ├── RecentScores.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   └── charts/
│   │   │   │       ├── ScoreTrendChart.tsx
│   │   │   │       ├── KYCStatusPie.tsx
│   │   │   │       ├── UsageBarChart.tsx
│   │   │   │       └── GeoHeatmap.tsx
│   │   │   │
│   │   │   ├── marketplace/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductFilter.tsx
│   │   │   │   ├── ApplicationForm.tsx
│   │   │   │   └── ApplicationStatus.tsx
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── DataSourceCard.tsx
│   │   │   │   ├── ImportWizard.tsx
│   │   │   │   ├── ColumnMapper.tsx
│   │   │   │   └── ImportProgress.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── DataTable.tsx
│   │   │       ├── Pagination.tsx
│   │   │       ├── SearchInput.tsx
│   │   │       ├── DateRangePicker.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       └── EmptyState.tsx
│   │   │
│   │   └── pages/
│   │       ├── public/
│   │       │   ├── Home.tsx
│   │       │   ├── Login.tsx
│   │       │   ├── Register.tsx
│   │       │   ├── ForgotPassword.tsx
│   │       │   └── ResetPassword.tsx
│   │       │
│   │       ├── dashboard/
│   │       │   ├── Overview.tsx
│   │       │   ├── Analytics.tsx
│   │       │   └── Settings.tsx
│   │       │
│   │       ├── kyc/
│   │       │   ├── KYCList.tsx
│   │       │   ├── KYCSubmit.tsx
│   │       │   ├── KYCDetail.tsx
│   │       │   └── KYCValidation.tsx
│   │       │
│   │       ├── scoring/
│   │       │   ├── ScoreRequest.tsx
│   │       │   ├── ScoreResults.tsx
│   │       │   ├── ScoreHistory.tsx
│   │       │   └── ScoreDetail.tsx
│   │       │
│   │       ├── subjects/
│   │       │   ├── SubjectsList.tsx
│   │       │   ├── SubjectCreate.tsx
│   │       │   ├── SubjectDetail.tsx
│   │       │   └── SubjectEdit.tsx
│   │       │
│   │       ├── data/
│   │       │   ├── DataSources.tsx
│   │       │   ├── ImportData.tsx
│   │       │   └── DataMapping.tsx
│   │       │
│   │       ├── marketplace/
│   │       │   ├── Products.tsx
│   │       │   ├── ProductDetail.tsx
│   │       │   ├── MyApplications.tsx
│   │       │   └── ApplicationDetail.tsx
│   │       │
│   │       ├── billing/
│   │       │   ├── Subscriptions.tsx
│   │       │   ├── Invoices.tsx
│   │       │   ├── InvoiceDetail.tsx
│   │       │   └── Usage.tsx
│   │       │
│   │       ├── admin/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── Users.tsx
│   │       │   ├── UserDetail.tsx
│   │       │   ├── Organizations.tsx
│   │       │   ├── OrganizationDetail.tsx
│   │       │   ├── Models.tsx
│   │       │   ├── AuditLogs.tsx
│   │       │   └── SystemConfig.tsx
│   │       │
│   │       └── api/
│   │           ├── APIKeys.tsx
│   │           ├── Documentation.tsx
│   │           ├── Webhooks.tsx
│   │           └── WebhookLogs.tsx
│   │
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
└── services/                          # Backend Microservices
    │
    ├── api-gateway/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── config/
    │   │   ├── middleware/
    │   │   │   ├── auth.middleware.ts
    │   │   │   ├── rate-limit.middleware.ts
    │   │   │   └── logging.middleware.ts
    │   │   └── routes/
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── auth-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── config/
    │   │   │   ├── configuration.ts
    │   │   │   └── validation.schema.ts
    │   │   ├── auth/
    │   │   │   ├── auth.module.ts
    │   │   │   ├── auth.controller.ts
    │   │   │   ├── auth.service.ts
    │   │   │   ├── strategies/
    │   │   │   │   ├── jwt.strategy.ts
    │   │   │   │   ├── refresh.strategy.ts
    │   │   │   │   └── local.strategy.ts
    │   │   │   ├── guards/
    │   │   │   │   ├── jwt-auth.guard.ts
    │   │   │   │   ├── roles.guard.ts
    │   │   │   │   └── throttle.guard.ts
    │   │   │   ├── decorators/
    │   │   │   │   ├── roles.decorator.ts
    │   │   │   │   └── current-user.decorator.ts
    │   │   │   └── dto/
    │   │   │       ├── login.dto.ts
    │   │   │       ├── register.dto.ts
    │   │   │       └── refresh-token.dto.ts
    │   │   ├── users/
    │   │   │   ├── users.module.ts
    │   │   │   ├── users.controller.ts
    │   │   │   ├── users.service.ts
    │   │   │   └── users.repository.ts
    │   │   ├── roles/
    │   │   │   ├── roles.module.ts
    │   │   │   ├── roles.service.ts
    │   │   │   └── role.enum.ts
    │   │   └── common/
    │   │       ├── filters/
    │   │       ├── interceptors/
    │   │       └── pipes/
    │   ├── prisma/
    │   │   └── schema.prisma
    │   ├── test/
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── kyc-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── kyc/
    │   │   │   ├── kyc.module.ts
    │   │   │   ├── kyc.controller.ts
    │   │   │   ├── kyc.service.ts
    │   │   │   └── dto/
    │   │   ├── documents/
    │   │   │   ├── documents.module.ts
    │   │   │   ├── documents.service.ts
    │   │   │   └── upload.service.ts
    │   │   ├── ocr/
    │   │   │   ├── ocr.module.ts
    │   │   │   ├── ocr.service.ts          # Tesseract integration
    │   │   │   ├── ocr.processor.ts        # Bull queue processor
    │   │   │   └── parsers/
    │   │   │       ├── cni.parser.ts
    │   │   │       ├── passport.parser.ts
    │   │   │       └── utility-bill.parser.ts
    │   │   └── validation/
    │   │       ├── validation.module.ts
    │   │       └── validation.service.ts
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── scoring-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── scoring/
    │   │   │   ├── scoring.module.ts
    │   │   │   ├── scoring.controller.ts
    │   │   │   ├── scoring.service.ts
    │   │   │   └── scoring.processor.ts
    │   │   ├── models/
    │   │   │   ├── models.module.ts
    │   │   │   ├── models.service.ts
    │   │   │   ├── tensorflow.service.ts    # TensorFlow.js
    │   │   │   └── onnx.service.ts          # ONNX Runtime
    │   │   ├── features/
    │   │   │   ├── features.module.ts
    │   │   │   ├── features.service.ts
    │   │   │   └── extractors/
    │   │   │       ├── telecom.extractor.ts
    │   │   │       ├── geo.extractor.ts
    │   │   │       └── financial.extractor.ts
    │   │   └── explainability/
    │   │       ├── explainability.module.ts
    │   │       ├── lime.service.ts
    │   │       └── shap.service.ts
    │   ├── models/                          # Trained models
    │   │   ├── credit-score-v1.0.json
    │   │   └── credit-score-v1.0.weights.bin
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── data-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── sources/
    │   │   │   ├── sources.module.ts
    │   │   │   ├── sources.controller.ts
    │   │   │   └── sources.service.ts
    │   │   ├── connectors/
    │   │   │   ├── connectors.module.ts
    │   │   │   ├── bceao-pispi.connector.ts
    │   │   │   ├── osm-nominatim.connector.ts
    │   │   │   ├── mtn-money.connector.ts
    │   │   │   ├── orange-money.connector.ts
    │   │   │   └── rccm.connector.ts
    │   │   ├── import/
    │   │   │   ├── import.module.ts
    │   │   │   ├── import.controller.ts
    │   │   │   ├── import.service.ts
    │   │   │   └── parsers/
    │   │   │       ├── csv.parser.ts
    │   │   │       ├── excel.parser.ts
    │   │   │       └── json.parser.ts
    │   │   ├── normalization/
    │   │   │   ├── normalization.module.ts
    │   │   │   ├── normalization.service.ts
    │   │   │   └── spacy.service.ts         # spaCy NLP
    │   │   └── sync/
    │   │       ├── sync.module.ts
    │   │       ├── sync.service.ts
    │   │       └── sync.scheduler.ts
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── marketplace-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── products/
    │   │   │   ├── products.module.ts
    │   │   │   ├── products.controller.ts
    │   │   │   └── products.service.ts
    │   │   ├── applications/
    │   │   │   ├── applications.module.ts
    │   │   │   ├── applications.controller.ts
    │   │   │   └── applications.service.ts
    │   │   └── matching/
    │   │       ├── matching.module.ts
    │   │       └── matching.service.ts
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── billing-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── subscriptions/
    │   │   ├── invoices/
    │   │   ├── usage/
    │   │   └── integrations/
    │   │       └── invoice-ninja.service.ts
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── webhook-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── webhooks/
    │   │   │   ├── webhooks.module.ts
    │   │   │   ├── webhooks.controller.ts
    │   │   │   └── webhooks.service.ts
    │   │   ├── dispatcher/
    │   │   │   ├── dispatcher.module.ts
    │   │   │   ├── dispatcher.service.ts
    │   │   │   └── dispatcher.processor.ts
    │   │   └── signatures/
    │   │       └── hmac.service.ts
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── audit-service/
    │   ├── src/
    │   │   ├── main.ts
    │   │   ├── app.module.ts
    │   │   ├── logs/
    │   │   ├── compliance/
    │   │   └── exports/
    │   ├── Dockerfile
    │   └── package.json
    │
    └── notification-service/
        ├── src/
        │   ├── main.ts
        │   ├── app.module.ts
        │   ├── email/
        │   │   ├── email.module.ts
        │   │   ├── email.service.ts
        │   │   └── templates/
        │   ├── sms/
        │   │   ├── sms.module.ts
        │   │   └── twilio.service.ts
        │   └── push/
        ├── Dockerfile
        └── package.json`;

  const envExample = `# Wouaka Credit Score - Environment Variables

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://wouaka:password@localhost:5432/wouaka
REDIS_URL=redis://localhost:6379

# ===========================================
# JWT & AUTH
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ===========================================
# STORAGE (MinIO / S3)
# ===========================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-minio-secret
MINIO_BUCKET=wouaka-documents

# ===========================================
# EXTERNAL APIs
# ===========================================
BCEAO_PISPI_URL=https://api.bceao.int/pispi
MTN_MONEY_API_KEY=your-mtn-api-key
MTN_MONEY_SECRET=your-mtn-secret
ORANGE_MONEY_API_KEY=your-orange-api-key
ORANGE_MONEY_SECRET=your-orange-secret

# ===========================================
# NOTIFICATIONS
# ===========================================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@wouaka.com
SMTP_PASSWORD=your-smtp-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# ===========================================
# BILLING (Invoice Ninja)
# ===========================================
INVOICE_NINJA_URL=https://invoicing.wouaka.com
INVOICE_NINJA_API_KEY=your-invoice-ninja-key

# ===========================================
# AI/ML
# ===========================================
MODEL_PATH=/app/models
DEFAULT_MODEL_VERSION=v1.0
SPACY_MODEL=fr_core_news_md

# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://app.wouaka.com,https://admin.wouaka.com
LOG_LEVEL=info`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/full-architecture">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Architecture
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <FolderTree className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Structure des Fichiers</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="max-w-4xl mx-auto mb-8">
          <Badge variant="score" className="mb-4">Monorepo Architecture</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Structure Complète du Projet
          </h1>
          <p className="text-lg text-muted-foreground">
            Organisation monorepo avec frontend React + Vite et 10 microservices NestJS.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Microservices", value: "10" },
            { label: "Pages Frontend", value: "35+" },
            { label: "Components", value: "50+" },
            { label: "Fichiers Total", value: "200+" },
          ].map((stat, i) => (
            <Card key={i} variant="stat">
              <CardContent className="p-4 text-center">
                <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Structure */}
        <Card variant="premium" className="mb-8 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm">Structure du Projet</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(projectStructure, 'structure')}
            >
              {copied === 'structure' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[60vh]">
              <pre className="p-6 text-xs font-mono text-foreground leading-relaxed">
                {projectStructure}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card variant="premium" className="overflow-hidden">
          <CardHeader className="bg-warning/10 border-b border-warning/20 flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm">.env.example</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(envExample, 'env')}
            >
              {copied === 'env' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[40vh]">
              <pre className="p-6 text-xs font-mono text-foreground leading-relaxed">
                {envExample}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-12">
          <Link to="/prisma-schema">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Schéma Prisma
            </Button>
          </Link>
          <Link to="/">
            <Button variant="hero">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FileStructure;
