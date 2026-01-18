# @wouaka/sdk

SDK officiel Wouaka pour l'intégration des APIs de credit scoring, KYC et vérification d'identité en Afrique de l'Ouest (UEMOA).

[![npm version](https://badge.fury.io/js/%40wouaka%2Fsdk.svg)](https://www.npmjs.com/package/@wouaka/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Installation

```bash
# npm
npm install @wouaka/sdk

# yarn
yarn add @wouaka/sdk

# pnpm
pnpm add @wouaka/sdk
```

## 📖 Documentation

Documentation complète disponible sur [wouaka-creditscore.com/developer](https://wouaka-creditscore.com/developer)

## ⚡ Quick Start

```typescript
import { WouakaClient } from '@wouaka/sdk';

// Initialisation
const wouaka = new WouakaClient({
  apiKey: 'wk_live_votre_cle_api',
  environment: 'production' // ou 'sandbox' pour les tests
});

// Calculer un score de crédit
const score = await wouaka.scores.calculate({
  phone_number: '+22507XXXXXXXX',
  full_name: 'Kouassi Jean',
  country: 'CI'
});

console.log(`Score: ${score.score} (${score.grade})`);
console.log(`Risque: ${score.risk_category}`);
```

## 🔑 Configuration

```typescript
const wouaka = new WouakaClient({
  // Clé API (obligatoire)
  apiKey: 'wk_live_xxx',
  
  // Environnement: 'production' ou 'sandbox'
  environment: 'production',
  
  // Timeout en ms (défaut: 30000)
  timeout: 30000,
  
  // Nombre de tentatives en cas d'erreur (défaut: 3)
  retries: 3,
});
```

## 📊 Scoring (WOUAKA EMPRUNTEUR)

```typescript
// Calculer un score
const result = await wouaka.scores.calculate({
  phone_number: '+22507XXXXXXXX',
  full_name: 'Kouassi Jean',
  national_id: 'CI-XXXXXXXXX', // optionnel
  country: 'CI',
  data_sources: ['mobile_money', 'telecom'], // optionnel
  consent: {
    given: true,
    timestamp: new Date().toISOString()
  }
});

// Résultat
console.log({
  score: result.score,           // 300-850
  grade: result.grade,           // A+ à E
  risk_category: result.risk_category,
  confidence: result.confidence,
  recommendation: result.recommendation
});

// Récupérer un score existant
const existing = await wouaka.scores.get('score_xxx');

// Lister l'historique
const history = await wouaka.scores.list({ page: 1, per_page: 20 });
```

## 🔍 Vérification (WOUAKA PARTENAIRE)

```typescript
// Vérifier un client
const kyc = await wouaka.kyc.verify({
  full_name: 'Kouassi Jean',
  national_id: 'CI-XXXXXXXXX',
  phone_number: '+22507XXXXXXXX',
  date_of_birth: '1990-05-15',
  document_type: 'national_id',
  document_number: 'XXXXXXXXX',
  document_expiry: '2028-12-31'
});

// Résultat
console.log({
  verified: kyc.verified,
  status: kyc.status,
  identity_score: kyc.identity_score,
  fraud_score: kyc.fraud_score,
  risk_level: kyc.risk_level,
  checks: kyc.checks
});
```

## 👤 Identity Lookup

```typescript
const identity = await wouaka.identity.lookup({
  phone_number: '+22507XXXXXXXX',
  national_id: 'CI-XXXXXXXXX'
});

if (identity.found) {
  console.log(identity.identity);
}
```

## ⚡ Precheck (Vérification Rapide)

```typescript
const precheck = await wouaka.precheck.check({
  phone_number: '+22507XXXXXXXX',
  full_name: 'Kouassi Jean'
});

if (precheck.eligible) {
  // Procéder à l'évaluation complète
  const score = await wouaka.scores.calculate({ ... });
}
```

## 🔔 Webhooks

```typescript
// Créer un webhook
const webhook = await wouaka.webhooks.create({
  url: 'https://votre-app.com/webhooks/wouaka',
  events: ['score.completed', 'kyc.verified', 'alert.fraud_detected'],
  name: 'Production Webhook'
});

console.log(`Secret: ${webhook.secret}`); // À stocker de manière sécurisée

// Lister les webhooks
const webhooks = await wouaka.webhooks.list();

// Tester un webhook
const test = await wouaka.webhooks.test(webhook.id);

// Vérifier les livraisons
const deliveries = await wouaka.webhooks.getDeliveries(webhook.id);
```

### Vérification de signature

```typescript
import { verifyWebhook } from '@wouaka/sdk';

// Dans votre endpoint webhook
app.post('/webhooks/wouaka', (req, res) => {
  const signature = req.headers['x-wouaka-signature'];
  const payload = JSON.stringify(req.body);
  
  const { valid, error } = verifyWebhook(payload, signature, webhookSecret);
  
  if (!valid) {
    return res.status(401).json({ error });
  }
  
  // Traiter l'événement
  const event = req.body;
  switch (event.type) {
    case 'score.completed':
      handleScoreCompleted(event.data);
      break;
    case 'kyc.verified':
      handleKycVerified(event.data);
      break;
  }
  
  res.json({ received: true });
});
```

## 🔐 Gestion des clés API

```typescript
// Lister les clés
const keys = await wouaka.apiKeys.list();

// Créer une nouvelle clé
const newKey = await wouaka.apiKeys.create('Production Key', ['score', 'kyc']);
console.log(`Nouvelle clé: ${newKey.key}`); // Affichée une seule fois

// Rotation de clé
const rotated = await wouaka.apiKeys.rotate(keyId);

// Révoquer une clé
await wouaka.apiKeys.revoke(keyId);
```

## 📈 Usage & Quotas

```typescript
// Statistiques d'utilisation
const stats = await wouaka.usage.getStats({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// Quotas du plan
const quota = await wouaka.usage.getQuota();
console.log(`${quota.requests_remaining}/${quota.requests_limit} requêtes restantes`);
```

## ⚠️ Gestion des erreurs

```typescript
import {
  WouakaError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  QuotaExceededError
} from '@wouaka/sdk';

try {
  const score = await wouaka.scores.calculate({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Clé API invalide');
  } else if (error instanceof ValidationError) {
    console.error('Données invalides:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit atteint, réessayer dans ${error.retryAfter}s`);
  } else if (error instanceof QuotaExceededError) {
    console.error('Quota épuisé, mettez à niveau votre plan');
  } else if (error instanceof WouakaError) {
    console.error(`Erreur ${error.code}:`, error.message);
  }
}
```

## 🛠 Utilitaires

```typescript
import {
  formatPhoneNumber,
  isValidUEMOAPhone,
  detectCountryFromPhone,
  scoreToGrade,
  scoreToRiskCategory,
  maskPhone,
  maskNationalId
} from '@wouaka/sdk';

// Formater un numéro
formatPhoneNumber('0707123456', 'CI'); // '+2250707123456'

// Valider un numéro UEMOA
isValidUEMOAPhone('+22507XXXXXXXX'); // true

// Détecter le pays
detectCountryFromPhone('+22507XXXXXXXX'); // 'CI'

// Convertir un score
scoreToGrade(720); // 'B+'
scoreToRiskCategory(720); // 'low'

// Masquer des données sensibles
maskPhone('+22507123456'); // '+22507****56'
maskNationalId('CI-12345678'); // 'CI****78'
```

## 🌍 Pays supportés (UEMOA)

| Code | Pays |
|------|------|
| CI | Côte d'Ivoire |
| SN | Sénégal |
| ML | Mali |
| BF | Burkina Faso |
| BJ | Bénin |
| TG | Togo |
| NE | Niger |
| GW | Guinée-Bissau |

## 📄 Licence

MIT © [Wouaka](https://wouaka-creditscore.com)

## 🆘 Support

- Documentation: [wouaka-creditscore.com/developer](https://wouaka-creditscore.com/developer)
- Email: dev@wouaka-creditscore.com
- Issues: [GitHub Issues](https://github.com/wouaka/sdk-js/issues)
