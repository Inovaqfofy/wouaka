# WOUAKA VPS Migration Guide

## 🚀 Migration de Lovable Cloud vers VPS Self-Hosted

Ce guide explique comment migrer Wouaka de Supabase/Lovable Cloud vers un VPS avec PostgreSQL, MinIO et Node.js.

---

## 📋 Prérequis

- VPS avec Ubuntu 22.04+ ou Debian 12+
- Docker et Docker Compose installés
- Domaine configuré: `wouaka-creditscore.com`
- Au moins 4GB RAM, 2 vCPU, 40GB SSD

---

## 📦 Architecture Self-Hosted

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80/443)                  │
│              SSL Termination + Reverse Proxy                │
└─────────────────┬───────────────┬───────────────┬───────────┘
                  │               │               │
    ┌─────────────▼─────┐  ┌──────▼──────┐  ┌────▼────┐
    │   Frontend (3000) │  │  API (3001) │  │  MinIO  │
    │   React + Nginx   │  │   Express   │  │  (9000) │
    └───────────────────┘  └──────┬──────┘  └────┬────┘
                                  │              │
                           ┌──────▼──────────────▼────┐
                           │   PostgreSQL (5432)       │
                           │   + Redis (6379)          │
                           └───────────────────────────┘
```

---

## 🔄 Étapes de Migration

### 1. Exporter les données de Supabase

```bash
# Dans Supabase SQL Editor, exécutez:
# scripts/export-supabase-data.sql

# Téléchargez les résultats en CSV
```

### 2. Préparer le VPS

```bash
# Sur votre VPS:
git clone https://github.com/votre-repo/wouaka.git
cd wouaka

# Copier le fichier d'environnement
cp .env.vps.example .env

# Éditer avec vos secrets de production
nano .env
```

### 3. Configurer les secrets

```env
# .env - À configurer impérativement:
POSTGRES_PASSWORD=un-mot-de-passe-très-fort
JWT_SECRET=une-clé-de-32-caractères-minimum
MINIO_SECRET_KEY=une-autre-clé-secrète

# Paiements CinetPay
CINETPAY_API_KEY=votre-clé
CINETPAY_SITE_ID=votre-site-id
CINETPAY_SECRET_KEY=votre-secret

# KYC Smile ID
SMILE_ID_PARTNER_ID=votre-partner-id
SMILE_ID_API_KEY=votre-api-key

# Email Resend
RESEND_API_KEY=votre-clé-resend
```

### 4. Importer les utilisateurs

```bash
# Éditez scripts/import-users.sql avec les données exportées
nano scripts/import-users.sql

# Les hashes bcrypt de Supabase sont compatibles avec Node.js
```

### 5. Déployer

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

### 6. Configurer DNS

Ajoutez ces enregistrements DNS chez IONOS:

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | IP_VPS |
| A | www | IP_VPS |
| A | api | IP_VPS |
| A | storage | IP_VPS |

### 7. SSL avec Certbot

```bash
# Installer Certbot
sudo apt install certbot

# Obtenir certificats
sudo certbot certonly --standalone \
  -d wouaka-creditscore.com \
  -d www.wouaka-creditscore.com \
  -d api.wouaka-creditscore.com \
  -d storage.wouaka-creditscore.com

# Copier vers le dossier SSL
sudo cp /etc/letsencrypt/live/wouaka-creditscore.com/fullchain.pem /opt/wouaka/ssl/
sudo cp /etc/letsencrypt/live/wouaka-creditscore.com/privkey.pem /opt/wouaka/ssl/

# Redémarrer nginx
docker-compose restart nginx
```

---

## 🔧 Différences avec Supabase

| Fonctionnalité | Supabase | VPS Self-Hosted |
|----------------|----------|-----------------|
| Auth | Supabase Auth | JWT Custom (bcrypt) |
| Database | Supabase Postgres | PostgreSQL 15 |
| Storage | Supabase Storage | MinIO (S3-compatible) |
| Edge Functions | Deno | Node.js + Express |
| Realtime | Supabase Realtime | Polling (WebSocket optionnel) |

---

## 🔐 Sécurité

### Rate Limiting

- API générale: 100 req/min par IP
- Scoring: 3 req/min par IP
- Auth: 5 tentatives/5 min

### Headers de sécurité

- HSTS activé
- XSS Protection
- Content Security Policy
- CORS restrictif

---

## 📊 Monitoring

```bash
# Voir les logs
docker-compose logs -f api

# Statistiques des conteneurs
docker stats

# Santé des services
curl http://localhost:3001/health
```

---

## 🔄 Mises à jour

```bash
cd /opt/wouaka
git pull origin main
docker-compose build
docker-compose up -d
```

---

## 🆘 Dépannage

### L'API ne démarre pas

```bash
docker-compose logs api
# Vérifier les variables d'environnement
docker-compose config
```

### Erreur de connexion DB

```bash
docker exec -it wouaka-postgres psql -U postgres -d wouaka
\dt  # Lister les tables
```

### MinIO inaccessible

```bash
docker-compose logs minio
# Vérifier les credentials dans .env
```

---

## 📞 Support

Pour toute question: support@wouaka.com
