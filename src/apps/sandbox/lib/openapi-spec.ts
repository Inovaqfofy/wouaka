/**
 * OpenAPI 3.1.0 Specification for Wouaka API
 * 
 * This file contains the complete API specification for:
 * - W-KYC: Identity verification engine
 * - W-SCORE: Credit scoring engine  
 * - WOUAKA CORE: Unified orchestration API
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Wouaka API",
    version: "1.0.0",
    description: `
# Wouaka Credit Scoring & KYC API

API souveraine de scoring de crédit et vérification d'identité pour l'Afrique de l'Ouest (UEMOA).

## Produits

| Produit | Description |
|---------|-------------|
| **WOUAKA EMPRUNTEUR** | Moteur de scoring de crédit multi-factoriel |
| **WOUAKA PARTENAIRE** | Vérification d'identité avec OCR et biométrie |
| **WOUAKA CORE** | Orchestrateur unifié KYC + Scoring + Décision |

## Authentification

Toutes les requêtes doivent inclure un header \`x-api-key\` ou \`Authorization: Bearer <JWT>\`.

\`\`\`bash
curl -X POST https://api.wouaka-creditscore.com/v1/dossier \\
  -H "x-api-key: wk_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json"
\`\`\`

## Rate Limiting

| Plan | Requêtes/minute | Requêtes/mois |
|------|-----------------|---------------|
| Starter | 60 | 10,000 |
| Business | 300 | 100,000 |
| Enterprise | 1,000 | Illimité |

## Erreurs

Toutes les erreurs suivent le format RFC 7807 Problem Details.
    `,
    termsOfService: "https://www.wouaka-creditscore.com/terms",
    contact: {
      name: "Wouaka Support",
      email: "support@wouaka-creditscore.com",
      url: "https://www.wouaka-creditscore.com/contact"
    },
    license: {
      name: "Proprietary",
      url: "https://www.wouaka-creditscore.com/license"
    }
  },
  servers: [
    {
      url: "https://api.wouaka-creditscore.com/v1",
      description: "Production API"
    },
    {
      url: "https://sandbox.wouaka-creditscore.com/v1",
      description: "Sandbox (test mode)"
    }
  ],
  tags: [
    {
      name: "Scoring",
      description: "Credit scoring endpoints (WOUAKA EMPRUNTEUR)"
    },
    {
      name: "Vérification", 
      description: "Identity verification endpoints (WOUAKA PARTENAIRE)"
    },
    {
      name: "WOUAKA CORE",
      description: "Unified orchestration endpoints"
    },
    {
      name: "Webhooks",
      description: "Webhook management"
    }
  ],
  paths: {
    "/wouaka-score": {
      post: {
        tags: ["Scoring"],
        operationId: "calculateScore",
        summary: "Calculer un score de crédit",
        description: `
Calcule un score de crédit souverain basé sur des données alternatives multi-sources.

## Algorithme

Le score final (0-100) est calculé via 6 sous-scores pondérés:
- **Stabilité financière** (25%): Revenus, épargne, flux Mobile Money
- **Comportement de paiement** (20%): Historique factures, régularité
- **Capital social** (15%): Tontines, coopératives, garants
- **Stabilité professionnelle** (15%): Ancienneté emploi, secteur
- **Empreinte numérique** (10%): Ancienneté SIM, usage data
- **Contexte géographique** (15%): Risque régional UEMOA

## Niveaux de confiance

| Niveau | Description |
|--------|-------------|
| \`verified\` | Données vérifiées via API ou registre officiel |
| \`partially_verified\` | Données croisées avec d'autres sources |
| \`declared\` | Données déclarées par l'utilisateur |
| \`unverified\` | Données non vérifiables |
        `,
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ScoreRequest"
              },
              examples: {
                minimal: {
                  summary: "Requête minimale",
                  value: {
                    phone_number: "+22507XXXXXXXX",
                    full_name: "Kouamé Jean",
                    consent: true
                  }
                },
                complete: {
                  summary: "Requête complète avec données alternatives",
                  value: {
                    phone_number: "+22507XXXXXXXX",
                    full_name: "Kouamé Jean",
                    national_id: "CI1234567890",
                    date_of_birth: "1990-05-15",
                    consent: true,
                    financial_data: {
                      monthly_income: 450000,
                      income_source: "salary",
                      employer_name: "SODECI",
                      employment_duration_months: 36
                    },
                    mobile_money: {
                      provider: "orange_money",
                      account_age_months: 24,
                      avg_monthly_transactions: 15,
                      avg_monthly_volume: 250000
                    },
                    social_capital: {
                      tontine_member: true,
                      tontine_amount: 50000,
                      cooperative_member: false,
                      guarantors_count: 2
                    },
                    location: {
                      country: "CI",
                      city: "Abidjan",
                      district: "Cocody"
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Score calculé avec succès",
            headers: {
              "X-Request-ID": {
                description: "Identifiant unique de la requête",
                schema: { type: "string" }
              },
              "X-Processing-Time": {
                description: "Temps de traitement en millisecondes",
                schema: { type: "integer" }
              }
            },
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ScoreResponse"
                },
                example: {
                  request_id: "req_abc123xyz",
                  score: {
                    final_score: 72,
                    grade: "B",
                    risk_tier: "low_risk",
                    confidence: 0.85,
                    sub_scores: {
                      financial_stability: { score: 75, confidence: 0.9 },
                      payment_behavior: { score: 80, confidence: 0.75 },
                      social_capital: { score: 65, confidence: 0.8 },
                      professional_stability: { score: 70, confidence: 0.85 },
                      digital_footprint: { score: 68, confidence: 0.95 },
                      geographic_context: { score: 72, confidence: 1.0 }
                    }
                  },
                  credit_recommendation: {
                    approved: true,
                    max_amount: 500000,
                    max_tenor_months: 12,
                    suggested_rate: 18.5,
                    conditions: ["Vérification employeur requise"]
                  },
                  fraud_analysis: {
                    fraud_score: 12,
                    risk_level: "low",
                    alerts: []
                  },
                  data_transparency: {
                    verified_sources: ["sim_age", "location"],
                    declared_sources: ["income", "employer"],
                    verification_rate: 0.45
                  },
                  processing_time_ms: 245,
                  created_at: "2026-01-16T10:30:00Z"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "422": {
            $ref: "#/components/responses/ValidationError"
          },
          "429": {
            $ref: "#/components/responses/RateLimited"
          },
          "500": {
            $ref: "#/components/responses/InternalError"
          }
        }
      }
    },
    "/wouaka-kyc": {
      post: {
        tags: ["Vérification"],
        operationId: "verifyIdentity",
        summary: "Vérifier une identité",
        description: `
Vérifie l'identité d'un individu via OCR de documents et validation biométrique.

## Pipeline de vérification

1. **OCR Document**: Extraction des champs via Tesseract.js + OpenCV.js
2. **Parsing MRZ**: Validation ICAO 9303 des checksums (TD1/TD3)
3. **Face Matching**: Comparaison selfie/photo document via FaceNet
4. **Liveness Detection**: Détection de preuve de vie (clignement yeux)
5. **Fraud Analysis**: Détection de documents falsifiés

## Types de documents supportés

| Type | Code | MRZ |
|------|------|-----|
| CNI CEDEAO | \`national_id\` | TD1 |
| Passeport | \`passport\` | TD3 |
| Permis de conduire | \`driver_license\` | Non |
| Carte consulaire | \`consular_card\` | Optionnel |

## Niveaux KYC

| Niveau | Vérifications |
|--------|---------------|
| \`basic\` | OCR + validation format |
| \`enhanced\` | + Face matching + MRZ |
| \`advanced\` | + Liveness + Fraud detection |
        `,
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/KycRequest"
              },
              examples: {
                basic: {
                  summary: "Vérification basique",
                  value: {
                    full_name: "Kouamé Jean",
                    national_id: "CI1234567890",
                    document_type: "national_id",
                    country: "CI",
                    level: "basic"
                  }
                },
                enhanced: {
                  summary: "Vérification avec biométrie",
                  value: {
                    full_name: "Kouamé Jean",
                    national_id: "CI1234567890",
                    date_of_birth: "1990-05-15",
                    document_type: "national_id",
                    country: "CI",
                    level: "enhanced",
                    document_image_url: "https://storage.wouaka.com/docs/abc123.jpg",
                    selfie_image_url: "https://storage.wouaka.com/selfies/abc123.jpg"
                  }
                },
                advanced: {
                  summary: "Vérification complète avec liveness",
                  value: {
                    full_name: "Kouamé Jean",
                    national_id: "CI1234567890",
                    date_of_birth: "1990-05-15",
                    phone_number: "+22507XXXXXXXX",
                    document_type: "passport",
                    country: "CI",
                    level: "advanced",
                    document_image_url: "https://storage.wouaka.com/docs/abc123.jpg",
                    selfie_image_url: "https://storage.wouaka.com/selfies/abc123.jpg",
                    liveness_video_url: "https://storage.wouaka.com/liveness/abc123.webm"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Vérification KYC effectuée",
            headers: {
              "X-KYC-ID": {
                description: "Identifiant unique de la vérification KYC",
                schema: { type: "string" }
              },
              "X-Processing-Time": {
                description: "Temps de traitement en millisecondes",
                schema: { type: "integer" }
              }
            },
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/KycResponse"
                },
                example: {
                  kyc_id: "kyc_def456uvw",
                  status: "verified",
                  identity_score: 92,
                  fraud_score: 8,
                  risk_level: "low",
                  checks: {
                    id_format_valid: { passed: true, confidence: 0.98, message: "Format CI valide" },
                    name_valid: { passed: true, confidence: 0.95, message: "Nom valide" },
                    age_valid: { passed: true, confidence: 1.0, message: "Âge: 35 ans" },
                    document_not_expired: { passed: true, confidence: 1.0, message: "Expire le 2028-05-15" },
                    face_match: { passed: true, confidence: 0.89, message: "Correspondance faciale confirmée" },
                    liveness: { passed: true, confidence: 0.92, message: "Preuve de vie validée" }
                  },
                  mrz_validated: true,
                  mrz_data: {
                    document_type: "ID",
                    country: "CIV",
                    surname: "KOUAME",
                    given_names: "JEAN",
                    document_number: "CI1234567890",
                    nationality: "CIV",
                    date_of_birth: "1990-05-15",
                    sex: "M",
                    expiry_date: "2028-05-15",
                    checksums_valid: true
                  },
                  fraud_indicators: [
                    { indicator: "document_tampering", detected: false, confidence: 0.95 },
                    { indicator: "synthetic_identity", detected: false, confidence: 0.88 }
                  ],
                  extracted_identity: {
                    full_name: "KOUAME JEAN",
                    national_id: "CI1234567890",
                    date_of_birth: "1990-05-15",
                    nationality: "Ivoirienne",
                    gender: "M"
                  },
                  processing_time_ms: 1850,
                  created_at: "2026-01-16T10:32:00Z"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "422": {
            $ref: "#/components/responses/ValidationError"
          },
          "500": {
            $ref: "#/components/responses/InternalError"
          }
        }
      }
    },
    "/wouaka-core": {
      post: {
        tags: ["WOUAKA CORE"],
        operationId: "processCore",
        summary: "Traitement unifié KYC + Scoring",
        description: `
Endpoint unifié qui orchestre le flux complet:
1. Vérification KYC
2. Calcul de score
3. Analyse de risque combinée
4. Décision automatique

## Flux de traitement

\`\`\`
Request → Auth → KYC Check → Score Calculation → Combined Risk → Decision → Webhooks
\`\`\`

## Décisions automatiques

| Risk Level | Action |
|------------|--------|
| \`low\` | \`approve\` - Approbation automatique |
| \`medium\` | \`review\` - Revue manuelle requise |
| \`high\` / \`critical\` | \`reject\` - Rejet automatique |

## Webhooks déclenchés

- \`kyc.verified\` / \`kyc.rejected\` / \`kyc.requires_review\`
- \`score.calculated\`
- \`fraud.detected\` (si score fraude > 50)
        `,
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CoreRequest"
              },
              example: {
                kyc: {
                  full_name: "Kouamé Jean",
                  national_id: "CI1234567890",
                  date_of_birth: "1990-05-15",
                  document_type: "national_id",
                  country: "CI",
                  level: "enhanced"
                },
                financial_data: {
                  monthly_income: 450000,
                  income_source: "salary"
                },
                mobile_money: {
                  provider: "orange_money",
                  avg_monthly_volume: 250000
                },
                consent: {
                  data_processing: true,
                  credit_check: true,
                  ip_address: "41.202.207.x"
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Traitement unifié effectué",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CoreResponse"
                },
                example: {
                  request_id: "core_xyz789abc",
                  status: "completed",
                  kyc: {
                    kyc_id: "kyc_def456",
                    status: "verified",
                    identity_score: 92,
                    risk_level: "low"
                  },
                  score: {
                    score_id: "score_abc123",
                    final_score: 72,
                    grade: "B",
                    confidence: 0.85
                  },
                  combined_risk: {
                    overall_risk: "low",
                    recommendation: "approve",
                    conditions: []
                  },
                  timeline: [
                    { step: "auth", duration_ms: 15 },
                    { step: "kyc", duration_ms: 1850 },
                    { step: "scoring", duration_ms: 245 },
                    { step: "risk_analysis", duration_ms: 12 }
                  ],
                  processing_time_ms: 2122,
                  created_at: "2026-01-16T10:35:00Z"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "500": {
            $ref: "#/components/responses/InternalError"
          }
        }
      }
    },
    "/partners-webhooks": {
      get: {
        tags: ["Webhooks"],
        operationId: "listWebhooks",
        summary: "Lister les webhooks",
        description: "Récupère la liste des webhooks configurés pour votre compte.",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        responses: {
          "200": {
            description: "Liste des webhooks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    webhooks: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Webhook"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Webhooks"],
        operationId: "createWebhook",
        summary: "Créer un webhook",
        description: "Crée un nouveau webhook pour recevoir des événements.",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    description: "URL de destination du webhook"
                  },
                  events: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "score.completed",
                        "score.failed",
                        "kyc.verified",
                        "kyc.rejected",
                        "kyc.requires_review",
                        "fraud.detected",
                        "quota.warning"
                      ]
                    },
                    description: "Événements à écouter"
                  },
                  secret: {
                    type: "string",
                    description: "Secret pour signer les payloads (optionnel, auto-généré si absent)"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Webhook créé",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Webhook"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Clé API au format `wk_live_xxxxxxxxxxxx` ou `wk_test_xxxxxxxxxxxx`"
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Supabase pour authentification utilisateur"
      }
    },
    schemas: {
      ScoreRequest: {
        type: "object",
        required: ["phone_number", "full_name", "consent"],
        properties: {
          phone_number: {
            type: "string",
            pattern: "^\\+[0-9]{10,15}$",
            description: "Numéro de téléphone au format international",
            example: "+22507XXXXXXXX"
          },
          full_name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            description: "Nom complet du client",
            example: "Kouamé Jean"
          },
          national_id: {
            type: "string",
            description: "Numéro de pièce d'identité",
            example: "CI1234567890"
          },
          date_of_birth: {
            type: "string",
            format: "date",
            description: "Date de naissance (YYYY-MM-DD)",
            example: "1990-05-15"
          },
          consent: {
            type: "boolean",
            description: "Consentement explicite du client"
          },
          financial_data: {
            $ref: "#/components/schemas/FinancialData"
          },
          mobile_money: {
            $ref: "#/components/schemas/MobileMoneyData"
          },
          social_capital: {
            $ref: "#/components/schemas/SocialCapitalData"
          },
          location: {
            $ref: "#/components/schemas/LocationData"
          }
        }
      },
      ScoreResponse: {
        type: "object",
        properties: {
          request_id: {
            type: "string",
            description: "Identifiant unique de la requête"
          },
          score: {
            type: "object",
            properties: {
              final_score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Score final (0-100)"
              },
              grade: {
                type: "string",
                enum: ["A+", "A", "B+", "B", "C+", "C", "D", "E"],
                description: "Grade de crédit"
              },
              risk_tier: {
                type: "string",
                enum: ["prime", "near_prime", "subprime", "deep_subprime", "high_risk"],
                description: "Catégorie de risque"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Niveau de confiance global"
              },
              sub_scores: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    confidence: { type: "number" }
                  }
                }
              }
            }
          },
          credit_recommendation: {
            $ref: "#/components/schemas/CreditRecommendation"
          },
          fraud_analysis: {
            $ref: "#/components/schemas/FraudAnalysis"
          },
          data_transparency: {
            $ref: "#/components/schemas/DataTransparency"
          },
          processing_time_ms: {
            type: "integer",
            description: "Temps de traitement en millisecondes"
          },
          created_at: {
            type: "string",
            format: "date-time"
          }
        }
      },
      KycRequest: {
        type: "object",
        required: ["full_name", "national_id", "document_type", "country"],
        properties: {
          full_name: {
            type: "string",
            description: "Nom complet à vérifier"
          },
          national_id: {
            type: "string",
            description: "Numéro de pièce d'identité"
          },
          date_of_birth: {
            type: "string",
            format: "date"
          },
          phone_number: {
            type: "string"
          },
          document_type: {
            type: "string",
            enum: ["national_id", "passport", "driver_license", "consular_card"],
            description: "Type de document"
          },
          country: {
            type: "string",
            enum: ["CI", "SN", "BF", "ML", "NE", "TG", "BJ", "GW"],
            description: "Code pays ISO 3166-1 alpha-2 (UEMOA)"
          },
          level: {
            type: "string",
            enum: ["basic", "enhanced", "advanced"],
            default: "basic",
            description: "Niveau de vérification"
          },
          document_image_url: {
            type: "string",
            format: "uri",
            description: "URL de l'image du document"
          },
          selfie_image_url: {
            type: "string",
            format: "uri",
            description: "URL du selfie"
          },
          liveness_video_url: {
            type: "string",
            format: "uri",
            description: "URL de la vidéo de liveness"
          }
        }
      },
      KycResponse: {
        type: "object",
        properties: {
          kyc_id: {
            type: "string"
          },
          status: {
            type: "string",
            enum: ["verified", "pending", "rejected", "requires_review"]
          },
          identity_score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          fraud_score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          risk_level: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          checks: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                passed: { type: "boolean" },
                confidence: { type: "number" },
                message: { type: "string" }
              }
            }
          },
          mrz_validated: {
            type: "boolean"
          },
          mrz_data: {
            $ref: "#/components/schemas/MRZData"
          },
          fraud_indicators: {
            type: "array",
            items: {
              $ref: "#/components/schemas/FraudIndicator"
            }
          },
          extracted_identity: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              national_id: { type: "string" },
              date_of_birth: { type: "string" },
              nationality: { type: "string" },
              gender: { type: "string" }
            }
          },
          processing_time_ms: {
            type: "integer"
          },
          created_at: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CoreRequest: {
        type: "object",
        required: ["kyc", "consent"],
        properties: {
          kyc: {
            $ref: "#/components/schemas/KycRequest"
          },
          financial_data: {
            $ref: "#/components/schemas/FinancialData"
          },
          mobile_money: {
            $ref: "#/components/schemas/MobileMoneyData"
          },
          social_capital: {
            $ref: "#/components/schemas/SocialCapitalData"
          },
          consent: {
            type: "object",
            required: ["data_processing"],
            properties: {
              data_processing: { type: "boolean" },
              credit_check: { type: "boolean" },
              ip_address: { type: "string" }
            }
          }
        }
      },
      CoreResponse: {
        type: "object",
        properties: {
          request_id: { type: "string" },
          status: {
            type: "string",
            enum: ["completed", "partial", "failed"]
          },
          kyc: {
            type: "object",
            properties: {
              kyc_id: { type: "string" },
              status: { type: "string" },
              identity_score: { type: "integer" },
              risk_level: { type: "string" }
            }
          },
          score: {
            type: "object",
            properties: {
              score_id: { type: "string" },
              final_score: { type: "integer" },
              grade: { type: "string" },
              confidence: { type: "number" }
            }
          },
          combined_risk: {
            type: "object",
            properties: {
              overall_risk: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              recommendation: {
                type: "string",
                enum: ["approve", "review", "reject"]
              },
              conditions: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          timeline: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "string" },
                duration_ms: { type: "integer" }
              }
            }
          },
          processing_time_ms: { type: "integer" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      FinancialData: {
        type: "object",
        properties: {
          monthly_income: {
            type: "integer",
            description: "Revenu mensuel en FCFA"
          },
          income_source: {
            type: "string",
            enum: ["salary", "business", "freelance", "agriculture", "remittances", "other"]
          },
          employer_name: { type: "string" },
          employment_duration_months: { type: "integer" },
          bank_account: { type: "boolean" },
          savings_amount: { type: "integer" }
        }
      },
      MobileMoneyData: {
        type: "object",
        properties: {
          provider: {
            type: "string",
            enum: ["orange_money", "mtn_momo", "wave", "moov_money", "free_money"]
          },
          account_age_months: { type: "integer" },
          avg_monthly_transactions: { type: "integer" },
          avg_monthly_volume: { type: "integer" },
          avg_balance: { type: "integer" }
        }
      },
      SocialCapitalData: {
        type: "object",
        properties: {
          tontine_member: { type: "boolean" },
          tontine_amount: { type: "integer" },
          tontine_frequency: {
            type: "string",
            enum: ["weekly", "biweekly", "monthly"]
          },
          cooperative_member: { type: "boolean" },
          guarantors_count: { type: "integer" }
        }
      },
      LocationData: {
        type: "object",
        properties: {
          country: { type: "string" },
          city: { type: "string" },
          district: { type: "string" },
          residence_duration_months: { type: "integer" }
        }
      },
      CreditRecommendation: {
        type: "object",
        properties: {
          approved: { type: "boolean" },
          max_amount: { type: "integer" },
          max_tenor_months: { type: "integer" },
          suggested_rate: { type: "number" },
          conditions: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      FraudAnalysis: {
        type: "object",
        properties: {
          fraud_score: { type: "integer" },
          risk_level: { type: "string" },
          alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rule: { type: "string" },
                severity: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      },
      DataTransparency: {
        type: "object",
        properties: {
          verified_sources: {
            type: "array",
            items: { type: "string" }
          },
          declared_sources: {
            type: "array",
            items: { type: "string" }
          },
          verification_rate: { type: "number" }
        }
      },
      MRZData: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          country: { type: "string" },
          surname: { type: "string" },
          given_names: { type: "string" },
          document_number: { type: "string" },
          nationality: { type: "string" },
          date_of_birth: { type: "string" },
          sex: { type: "string" },
          expiry_date: { type: "string" },
          checksums_valid: { type: "boolean" }
        }
      },
      FraudIndicator: {
        type: "object",
        properties: {
          indicator: { type: "string" },
          detected: { type: "boolean" },
          confidence: { type: "number" }
        }
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          events: {
            type: "array",
            items: { type: "string" }
          },
          is_active: { type: "boolean" },
          secret: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Error: {
        type: "object",
        properties: {
          type: { type: "string", format: "uri" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
          instance: { type: "string" }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Requête invalide",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              type: "https://www.wouaka-creditscore.com/errors/bad-request",
              title: "Bad Request",
              status: 400,
              detail: "Le champ 'phone_number' est requis",
              instance: "/v1/score"
            }
          }
        }
      },
      Unauthorized: {
        description: "Non autorisé",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              type: "https://www.wouaka-creditscore.com/errors/unauthorized",
              title: "Unauthorized",
              status: 401,
              detail: "Clé API invalide ou expirée",
              instance: "/v1/score"
            }
          }
        }
      },
      ValidationError: {
        description: "Erreur de validation",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              type: "https://www.wouaka-creditscore.com/errors/validation",
              title: "Validation Error",
              status: 422,
              detail: "Le numéro de téléphone doit commencer par +225",
              instance: "/v1/score"
            }
          }
        }
      },
      RateLimited: {
        description: "Limite de requêtes atteinte",
        headers: {
          "X-RateLimit-Limit": {
            description: "Limite de requêtes par minute",
            schema: { type: "integer" }
          },
          "X-RateLimit-Remaining": {
            description: "Requêtes restantes",
            schema: { type: "integer" }
          },
          "X-RateLimit-Reset": {
            description: "Timestamp de réinitialisation",
            schema: { type: "integer" }
          }
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              type: "https://www.wouaka-creditscore.com/errors/rate-limited",
              title: "Too Many Requests",
              status: 429,
              detail: "Limite de 60 requêtes/minute atteinte. Réessayez dans 45 secondes.",
              instance: "/v1/score"
            }
          }
        }
      },
      InternalError: {
        description: "Erreur serveur interne",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              type: "https://www.wouaka-creditscore.com/errors/internal",
              title: "Internal Server Error",
              status: 500,
              detail: "Une erreur inattendue s'est produite. Contactez le support.",
              instance: "/v1/score"
            }
          }
        }
      }
    }
  }
};

// Export as JSON string for download
export const openApiSpecJson = JSON.stringify(openApiSpec, null, 2);

// Export as YAML-like string for display
export const openApiSpecYaml = `
openapi: 3.1.0
info:
  title: Wouaka API
  version: 1.0.0
  description: API souveraine de scoring et KYC pour l'Afrique de l'Ouest

servers:
  - url: https://api.wouaka-creditscore.com/v1
    description: Production

paths:
  /wouaka-score:
    post:
      summary: Calculer un score de crédit
      tags: [W-SCORE]
      
  /wouaka-kyc:
    post:
      summary: Vérifier une identité
      tags: [W-KYC]
      
  /wouaka-core:
    post:
      summary: Traitement unifié KYC + Scoring
      tags: [WOUAKA CORE]

# Full specification available in JSON format
`;
