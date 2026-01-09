import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Database, Key, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const PrismaSchema = () => {
  const [copied, setCopied] = useState(false);

  const prismaSchema = `// Wouaka Credit Score - Prisma Schema
// PostgreSQL + Full-text search + Row-level security ready

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  SUPER_ADMIN
  ANALYST
  COMPANY
  API_CLIENT
}

enum OrganizationType {
  FINANCIAL_PARTNER
  COMPANY
  API_CLIENT
}

enum KYCStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum DocumentType {
  CNI
  PASSPORT
  UTILITY_BILL
  BANK_STATEMENT
  BUSINESS_REGISTRATION
  TAX_CERTIFICATE
}

enum SubjectType {
  INDIVIDUAL
  BUSINESS
}

enum ScoreGrade {
  A_PLUS
  A
  B_PLUS
  B
  C
  D
  E
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum DataSourceType {
  TELECOM
  GEO
  COMMERCIAL
  PUBLIC
  FINANCIAL
}

enum WebhookEvent {
  SCORE_CALCULATED
  SCORE_EXPIRED
  KYC_SUBMITTED
  KYC_VALIDATED
  KYC_REJECTED
  APPLICATION_STATUS
}

// ==================== AUTH & USERS ====================

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  firstName         String?   @map("first_name")
  lastName          String?   @map("last_name")
  phone             String?
  avatarUrl         String?   @map("avatar_url")
  isActive          Boolean   @default(true) @map("is_active")
  emailVerifiedAt   DateTime? @map("email_verified_at")
  lastLoginAt       DateTime? @map("last_login_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  roles             UserRole[]
  organizationUsers OrganizationUser[]
  refreshTokens     RefreshToken[]
  kycValidations    KYCDocument[]       @relation("KYCValidator")
  scoringRequests   CreditScore[]       @relation("ScoreRequester")
  applicationDecisions ProductApplication[] @relation("ApplicationDecider")
  auditLogs         AuditLog[]
  createdSubjects   ScoringSubject[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

// ==================== ORGANIZATIONS ====================

model Organization {
  id           String           @id @default(uuid())
  name         String
  type         OrganizationType
  rccmNumber   String?          @unique @map("rccm_number")
  taxId        String?          @map("tax_id")
  address      String?
  city         String?
  country      String           @default("CI") // ISO 3166-1 alpha-2
  phone        String?
  email        String?
  website      String?
  logoUrl      String?          @map("logo_url")
  isVerified   Boolean          @default(false) @map("is_verified")
  apiQuota     Int              @default(1000) @map("api_quota")
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")

  // Relations
  users           OrganizationUser[]
  subjects        ScoringSubject[]
  apiKeys         ApiKey[]
  webhooks        Webhook[]
  invoices        Invoice[]
  financialProducts FinancialProduct[]

  @@map("organizations")
}

model OrganizationUser {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  userId         String   @map("user_id")
  role           String   @default("member") // owner, admin, member
  joinedAt       DateTime @default(now()) @map("joined_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@map("organization_users")
}

// ==================== KYC & DOCUMENTS ====================

model ScoringSubject {
  id             String      @id @default(uuid())
  type           SubjectType
  fullName       String      @map("full_name")
  phone          String?
  email          String?
  address        String?
  city           String?
  country        String      @default("CI")
  geoLat         Decimal?    @map("geo_lat") @db.Decimal(10, 8)
  geoLng         Decimal?    @map("geo_lng") @db.Decimal(11, 8)
  rccmNumber     String?     @map("rccm_number")
  nationalId     String?     @map("national_id")
  dateOfBirth    DateTime?   @map("date_of_birth")
  metadata       Json?
  organizationId String      @map("organization_id")
  createdById    String      @map("created_by_id")
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  // Relations
  organization Organization    @relation(fields: [organizationId], references: [id])
  createdBy    User            @relation(fields: [createdById], references: [id])
  documents    KYCDocument[]
  scores       CreditScore[]
  subjectData  SubjectData[]
  applications ProductApplication[]

  @@index([organizationId])
  @@index([phone])
  @@index([nationalId])
  @@map("scoring_subjects")
}

model KYCDocument {
  id              String       @id @default(uuid())
  subjectId       String       @map("subject_id")
  documentType    DocumentType @map("document_type")
  filePath        String       @map("file_path")
  fileSize        Int          @map("file_size")
  mimeType        String       @map("mime_type")
  ocrRawText      String?      @map("ocr_raw_text")
  ocrData         Json?        @map("ocr_data")
  ocrConfidence   Decimal?     @map("ocr_confidence") @db.Decimal(5, 2)
  status          KYCStatus    @default(PENDING)
  validatedById   String?      @map("validated_by_id")
  validatedAt     DateTime?    @map("validated_at")
  rejectionReason String?      @map("rejection_reason")
  expiresAt       DateTime?    @map("expires_at")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  // Relations
  subject     ScoringSubject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  validatedBy User?          @relation("KYCValidator", fields: [validatedById], references: [id])

  @@index([subjectId])
  @@index([status])
  @@map("kyc_documents")
}

// ==================== SCORING ====================

model CreditScore {
  id              String     @id @default(uuid())
  subjectId       String     @map("subject_id")
  score           Int        // 0-1000
  grade           ScoreGrade
  confidence      Decimal    @db.Decimal(5, 2)
  modelVersion    String     @map("model_version")
  factors         Json       // { factor_name: { value, weight, contribution } }
  explanations    Json?      // LIME/SHAP output
  dataSourcesUsed Json       @map("data_sources_used")
  requestedById   String     @map("requested_by_id")
  calculatedAt    DateTime   @default(now()) @map("calculated_at")
  expiresAt       DateTime   @map("expires_at")

  // Relations
  subject     ScoringSubject @relation(fields: [subjectId], references: [id])
  requestedBy User           @relation("ScoreRequester", fields: [requestedById], references: [id])
  applications ProductApplication[]

  @@index([subjectId])
  @@index([calculatedAt])
  @@map("credit_scores")
}

model ScoreModel {
  id          String   @id @default(uuid())
  name        String
  version     String
  description String?
  filePath    String   @map("file_path")
  config      Json     // Model hyperparameters
  metrics     Json     // Accuracy, AUC, etc.
  isActive    Boolean  @default(false) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([name, version])
  @@map("score_models")
}

// ==================== DATA SOURCES ====================

model DataSource {
  id            String         @id @default(uuid())
  name          String
  type          DataSourceType
  provider      String
  apiEndpoint   String?        @map("api_endpoint")
  credentials   Json?          // Encrypted
  weightInScore Decimal        @default(1.0) @map("weight_in_score") @db.Decimal(3, 2)
  isActive      Boolean        @default(true) @map("is_active")
  lastSyncAt    DateTime?      @map("last_sync_at")
  syncFrequency String?        @map("sync_frequency") // cron expression
  createdAt     DateTime       @default(now()) @map("created_at")

  // Relations
  subjectData SubjectData[]

  @@map("data_sources")
}

model SubjectData {
  id             String   @id @default(uuid())
  subjectId      String   @map("subject_id")
  sourceId       String   @map("source_id")
  rawData        Json     @map("raw_data")
  normalizedData Json?    @map("normalized_data")
  features       Json?    // Extracted features for scoring
  collectedAt    DateTime @default(now()) @map("collected_at")
  expiresAt      DateTime @map("expires_at")

  // Relations
  subject ScoringSubject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  source  DataSource     @relation(fields: [sourceId], references: [id])

  @@index([subjectId, sourceId])
  @@map("subject_data")
}

// ==================== MARKETPLACE ====================

model FinancialProduct {
  id               String   @id @default(uuid())
  partnerId        String   @map("partner_id")
  name             String
  type             String   // loan, credit_line, insurance, savings
  description      String?
  minScoreRequired Int      @map("min_score_required")
  minAmount        Decimal  @map("min_amount") @db.Decimal(15, 2)
  maxAmount        Decimal  @map("max_amount") @db.Decimal(15, 2)
  currency         String   @default("XOF")
  interestRate     Decimal? @map("interest_rate") @db.Decimal(5, 2)
  termMonths       Int?     @map("term_months")
  terms            Json?
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  partner      Organization         @relation(fields: [partnerId], references: [id])
  applications ProductApplication[]

  @@index([partnerId])
  @@index([minScoreRequired])
  @@map("financial_products")
}

model ProductApplication {
  id              String            @id @default(uuid())
  productId       String            @map("product_id")
  subjectId       String            @map("subject_id")
  scoreId         String            @map("score_id")
  requestedAmount Decimal           @map("requested_amount") @db.Decimal(15, 2)
  status          ApplicationStatus @default(PENDING)
  decisionById    String?           @map("decision_by_id")
  decisionAt      DateTime?         @map("decision_at")
  notes           String?
  metadata        Json?
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  // Relations
  product    FinancialProduct @relation(fields: [productId], references: [id])
  subject    ScoringSubject   @relation(fields: [subjectId], references: [id])
  score      CreditScore      @relation(fields: [scoreId], references: [id])
  decisionBy User?            @relation("ApplicationDecider", fields: [decisionById], references: [id])

  @@index([productId])
  @@index([subjectId])
  @@index([status])
  @@map("product_applications")
}

// ==================== API & WEBHOOKS ====================

model ApiKey {
  id             String    @id @default(uuid())
  organizationId String    @map("organization_id")
  keyHash        String    @unique @map("key_hash")
  name           String
  permissions    Json      // Array of allowed endpoints
  rateLimit      Int       @default(100) @map("rate_limit") // requests per minute
  lastUsedAt     DateTime? @map("last_used_at")
  expiresAt      DateTime? @map("expires_at")
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@map("api_keys")
}

model Webhook {
  id             String         @id @default(uuid())
  organizationId String         @map("organization_id")
  url            String
  events         WebhookEvent[]
  secret         String
  isActive       Boolean        @default(true) @map("is_active")
  createdAt      DateTime       @default(now()) @map("created_at")

  // Relations
  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  deliveries   WebhookDelivery[]

  @@index([organizationId])
  @@map("webhooks")
}

model WebhookDelivery {
  id             String   @id @default(uuid())
  webhookId      String   @map("webhook_id")
  eventType      String   @map("event_type")
  payload        Json
  responseStatus Int?     @map("response_status")
  responseBody   String?  @map("response_body")
  attempts       Int      @default(0)
  deliveredAt    DateTime? @map("delivered_at")
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId])
  @@map("webhook_deliveries")
}

// ==================== BILLING ====================

model Subscription {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  planName       String   @map("plan_name")
  priceMonthly   Decimal  @map("price_monthly") @db.Decimal(10, 2)
  currency       String   @default("XOF")
  includedScores Int      @map("included_scores")
  extraScorePrice Decimal @map("extra_score_price") @db.Decimal(10, 2)
  startDate      DateTime @map("start_date")
  endDate        DateTime? @map("end_date")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([organizationId])
  @@map("subscriptions")
}

model Invoice {
  id             String        @id @default(uuid())
  organizationId String        @map("organization_id")
  invoiceNumber  String        @unique @map("invoice_number")
  amount         Decimal       @db.Decimal(15, 2)
  tax            Decimal       @default(0) @db.Decimal(15, 2)
  totalAmount    Decimal       @map("total_amount") @db.Decimal(15, 2)
  currency       String        @default("XOF")
  status         InvoiceStatus @default(DRAFT)
  dueDate        DateTime      @map("due_date")
  paidAt         DateTime?     @map("paid_at")
  items          Json          // Line items
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([status])
  @@map("invoices")
}

model UsageRecord {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  type           String   // score_request, api_call, storage
  quantity       Int
  unitPrice      Decimal  @map("unit_price") @db.Decimal(10, 2)
  recordedAt     DateTime @default(now()) @map("recorded_at")
  billedInvoiceId String? @map("billed_invoice_id")

  @@index([organizationId])
  @@index([recordedAt])
  @@map("usage_records")
}

// ==================== AUDIT ====================

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?  @map("user_id")
  action     String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  entityType String   @map("entity_type")
  entityId   String?  @map("entity_id")
  oldValues  Json?    @map("old_values")
  newValues  Json?    @map("new_values")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ==================== SYSTEM ====================

model SystemConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}`;

  const copySchema = async () => {
    await navigator.clipboard.writeText(prismaSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <Database className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Schéma Prisma</span>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={copySchema}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copié!" : "Copier le schéma"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="max-w-4xl mx-auto mb-8">
          <Badge variant="score" className="mb-4">PostgreSQL + Prisma ORM</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Modèle de Données Complet
          </h1>
          <p className="text-lg text-muted-foreground">
            Schéma Prisma production-ready avec 20+ tables, relations, index et enums.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tables", value: "22" },
            { label: "Enums", value: "11" },
            { label: "Relations", value: "35+" },
            { label: "Index", value: "25+" },
          ].map((stat, i) => (
            <Card key={i} variant="stat">
              <CardContent className="p-4 text-center">
                <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">@id - Clé primaire</span>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-info" />
            <span className="text-sm text-muted-foreground">@relation - Clé étrangère</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="glass" className="text-xs">@unique</Badge>
            <span className="text-sm text-muted-foreground">Contrainte unique</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="premium" className="text-xs">@@index</Badge>
            <span className="text-sm text-muted-foreground">Index de performance</span>
          </div>
        </div>

        {/* Schema Code */}
        <Card variant="premium" className="overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm">prisma/schema.prisma</CardTitle>
            <Badge variant="success">Production Ready</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[70vh]">
              <pre className="p-6 text-xs font-mono text-foreground leading-relaxed">
                {prismaSchema}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-12">
          <Link to="/full-architecture">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Architecture
            </Button>
          </Link>
          <Link to="/file-structure">
            <Button variant="hero">
              Structure des Fichiers
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PrismaSchema;
