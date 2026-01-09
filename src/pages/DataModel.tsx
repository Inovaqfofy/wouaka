import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Key, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

const DataModel = () => {
  const tables = [
    {
      name: "users",
      description: "Utilisateurs du système",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "email", type: "VARCHAR(255)", unique: true },
        { name: "password_hash", type: "VARCHAR(255)" },
        { name: "first_name", type: "VARCHAR(100)" },
        { name: "last_name", type: "VARCHAR(100)" },
        { name: "phone", type: "VARCHAR(20)" },
        { name: "is_active", type: "BOOLEAN" },
        { name: "email_verified_at", type: "TIMESTAMP" },
        { name: "created_at", type: "TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "roles",
      description: "Définition des rôles RBAC",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "name", type: "ENUM", note: "super_admin, analyst, company, api_user" },
        { name: "description", type: "TEXT" },
        { name: "permissions", type: "JSONB" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "user_roles",
      description: "Association utilisateurs-rôles",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "user_id", type: "UUID", fk: "users" },
        { name: "role_id", type: "UUID", fk: "roles" },
        { name: "granted_by", type: "UUID", fk: "users" },
        { name: "granted_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "organizations",
      description: "Entreprises/Partenaires",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "name", type: "VARCHAR(255)" },
        { name: "type", type: "ENUM", note: "financial_partner, company, api_client" },
        { name: "rccm_number", type: "VARCHAR(50)" },
        { name: "tax_id", type: "VARCHAR(50)" },
        { name: "address", type: "TEXT" },
        { name: "country", type: "VARCHAR(2)" },
        { name: "is_verified", type: "BOOLEAN" },
        { name: "api_quota", type: "INTEGER" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "organization_users",
      description: "Membres d'une organisation",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "organization_id", type: "UUID", fk: "organizations" },
        { name: "user_id", type: "UUID", fk: "users" },
        { name: "role", type: "ENUM", note: "owner, admin, member" },
        { name: "joined_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "kyc_documents",
      description: "Documents KYC soumis",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "subject_id", type: "UUID", fk: "scoring_subjects" },
        { name: "document_type", type: "ENUM", note: "cni, passport, utility_bill" },
        { name: "file_path", type: "VARCHAR(500)" },
        { name: "ocr_data", type: "JSONB" },
        { name: "status", type: "ENUM", note: "pending, approved, rejected" },
        { name: "validated_by", type: "UUID", fk: "users" },
        { name: "validated_at", type: "TIMESTAMP" },
        { name: "rejection_reason", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "scoring_subjects",
      description: "Personnes/Entités à scorer",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "type", type: "ENUM", note: "individual, business" },
        { name: "full_name", type: "VARCHAR(255)" },
        { name: "phone", type: "VARCHAR(20)" },
        { name: "email", type: "VARCHAR(255)" },
        { name: "address", type: "TEXT" },
        { name: "geo_lat", type: "DECIMAL(10,8)" },
        { name: "geo_lng", type: "DECIMAL(11,8)" },
        { name: "rccm_number", type: "VARCHAR(50)" },
        { name: "metadata", type: "JSONB" },
        { name: "created_by", type: "UUID", fk: "users" },
        { name: "organization_id", type: "UUID", fk: "organizations" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "credit_scores",
      description: "Scores de crédit calculés",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "subject_id", type: "UUID", fk: "scoring_subjects" },
        { name: "score", type: "INTEGER", note: "0-1000" },
        { name: "grade", type: "CHAR(2)", note: "A+, A, B+, B, C, D, E" },
        { name: "confidence", type: "DECIMAL(5,2)" },
        { name: "model_version", type: "VARCHAR(50)" },
        { name: "factors", type: "JSONB" },
        { name: "explanations", type: "JSONB", note: "LIME/SHAP output" },
        { name: "data_sources_used", type: "JSONB" },
        { name: "calculated_at", type: "TIMESTAMP" },
        { name: "expires_at", type: "TIMESTAMP" },
        { name: "requested_by", type: "UUID", fk: "users" },
      ],
    },
    {
      name: "data_sources",
      description: "Sources de données configurées",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "name", type: "VARCHAR(100)" },
        { name: "type", type: "ENUM", note: "telecom, geo, commercial, public" },
        { name: "provider", type: "VARCHAR(100)" },
        { name: "api_endpoint", type: "VARCHAR(500)" },
        { name: "credentials", type: "JSONB", note: "encrypted" },
        { name: "weight_in_score", type: "DECIMAL(3,2)" },
        { name: "is_active", type: "BOOLEAN" },
        { name: "last_sync", type: "TIMESTAMP" },
      ],
    },
    {
      name: "subject_data",
      description: "Données collectées par sujet",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "subject_id", type: "UUID", fk: "scoring_subjects" },
        { name: "source_id", type: "UUID", fk: "data_sources" },
        { name: "raw_data", type: "JSONB" },
        { name: "normalized_data", type: "JSONB" },
        { name: "collected_at", type: "TIMESTAMP" },
        { name: "expires_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "financial_products",
      description: "Produits financiers marketplace",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "partner_id", type: "UUID", fk: "organizations" },
        { name: "name", type: "VARCHAR(255)" },
        { name: "type", type: "ENUM", note: "loan, credit_line, insurance" },
        { name: "min_score_required", type: "INTEGER" },
        { name: "min_amount", type: "DECIMAL(15,2)" },
        { name: "max_amount", type: "DECIMAL(15,2)" },
        { name: "interest_rate", type: "DECIMAL(5,2)" },
        { name: "terms", type: "JSONB" },
        { name: "is_active", type: "BOOLEAN" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "product_applications",
      description: "Demandes de produits",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "product_id", type: "UUID", fk: "financial_products" },
        { name: "subject_id", type: "UUID", fk: "scoring_subjects" },
        { name: "score_id", type: "UUID", fk: "credit_scores" },
        { name: "requested_amount", type: "DECIMAL(15,2)" },
        { name: "status", type: "ENUM", note: "pending, approved, rejected" },
        { name: "decision_at", type: "TIMESTAMP" },
        { name: "decision_by", type: "UUID", fk: "users" },
        { name: "notes", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "api_keys",
      description: "Clés API partenaires",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "organization_id", type: "UUID", fk: "organizations" },
        { name: "key_hash", type: "VARCHAR(255)" },
        { name: "name", type: "VARCHAR(100)" },
        { name: "permissions", type: "JSONB" },
        { name: "rate_limit", type: "INTEGER" },
        { name: "last_used_at", type: "TIMESTAMP" },
        { name: "expires_at", type: "TIMESTAMP" },
        { name: "is_active", type: "BOOLEAN" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "webhooks",
      description: "Configuration webhooks",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "organization_id", type: "UUID", fk: "organizations" },
        { name: "url", type: "VARCHAR(500)" },
        { name: "events", type: "JSONB", note: "score.calculated, kyc.validated..." },
        { name: "secret", type: "VARCHAR(255)" },
        { name: "is_active", type: "BOOLEAN" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "webhook_deliveries",
      description: "Historique des webhooks envoyés",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "webhook_id", type: "UUID", fk: "webhooks" },
        { name: "event_type", type: "VARCHAR(100)" },
        { name: "payload", type: "JSONB" },
        { name: "response_status", type: "INTEGER" },
        { name: "response_body", type: "TEXT" },
        { name: "attempts", type: "INTEGER" },
        { name: "delivered_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "invoices",
      description: "Facturation",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "organization_id", type: "UUID", fk: "organizations" },
        { name: "invoice_number", type: "VARCHAR(50)", unique: true },
        { name: "amount", type: "DECIMAL(15,2)" },
        { name: "currency", type: "CHAR(3)" },
        { name: "status", type: "ENUM", note: "draft, sent, paid, overdue" },
        { name: "due_date", type: "DATE" },
        { name: "paid_at", type: "TIMESTAMP" },
        { name: "items", type: "JSONB" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      name: "audit_logs",
      description: "Logs d'audit complets",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "user_id", type: "UUID", fk: "users" },
        { name: "action", type: "VARCHAR(100)" },
        { name: "entity_type", type: "VARCHAR(50)" },
        { name: "entity_id", type: "UUID" },
        { name: "old_values", type: "JSONB" },
        { name: "new_values", type: "JSONB" },
        { name: "ip_address", type: "INET" },
        { name: "user_agent", type: "TEXT" },
        { name: "created_at", type: "TIMESTAMP" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/architecture">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Architecture
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Database className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Modèle de Données</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="max-w-4xl mx-auto mb-12">
          <Badge variant="premium" className="mb-4">Base de Données PostgreSQL</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Modèle de Données Complet
          </h1>
          <p className="text-lg text-muted-foreground">
            {tables.length} tables avec relations, contraintes et types de données. Compatible Prisma ORM.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">Clé primaire</span>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-info" />
            <span className="text-sm text-muted-foreground">Clé étrangère</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="glass" className="text-xs">UNIQUE</Badge>
            <span className="text-sm text-muted-foreground">Contrainte unique</span>
          </div>
        </div>

        {/* Tables */}
        <div className="space-y-6">
          {tables.map((table, i) => (
            <Card key={i} variant="premium" className="overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-mono">{table.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{table.fields.length} colonnes</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{table.description}</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 font-medium w-8"></th>
                        <th className="text-left p-3 font-medium">Colonne</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {table.fields.map((field, j) => (
                        <tr key={j} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            {field.pk && <Key className="w-4 h-4 text-warning" />}
                            {field.fk && <LinkIcon className="w-4 h-4 text-info" />}
                          </td>
                          <td className="p-3 font-mono text-foreground">{field.name}</td>
                          <td className="p-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{field.type}</code>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {field.fk && <span className="text-info">→ {field.fk}</span>}
                            {field.unique && <Badge variant="glass" className="text-xs">UNIQUE</Badge>}
                            {field.note && <span className="text-xs">{field.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-12">
          <Link to="/architecture">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Architecture
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

export default DataModel;
