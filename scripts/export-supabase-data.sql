-- ============================================
-- WOUAKA - SCRIPT D'EXPORT DES DONNÉES SUPABASE
-- ============================================
-- Ce script exporte toutes les données utilisateurs et business
-- pour migration vers PostgreSQL self-hosted
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Exportez les résultats en CSV ou JSON
-- 3. Importez dans votre PostgreSQL VPS
-- ============================================

-- ============================================
-- ÉTAPE 1: EXPORT DES UTILISATEURS (auth.users)
-- ============================================
-- Note: Les passwords sont hashés avec bcrypt, ils seront compatibles
-- avec le nouveau système JWT

SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token
FROM auth.users
ORDER BY created_at;

-- ============================================
-- ÉTAPE 2: EXPORT DES PROFILS
-- ============================================

SELECT 
  id,
  email,
  full_name,
  phone,
  company,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at;

-- ============================================
-- ÉTAPE 3: EXPORT DES RÔLES
-- ============================================

SELECT 
  id,
  user_id,
  role::text as role,
  granted_by,
  granted_at
FROM public.user_roles
ORDER BY granted_at;

-- ============================================
-- ÉTAPE 4: EXPORT DES ABONNEMENTS
-- ============================================

SELECT * FROM public.subscriptions ORDER BY created_at;
SELECT * FROM public.subscription_plans ORDER BY created_at;

-- ============================================
-- ÉTAPE 5: EXPORT DES CERTIFICATS
-- ============================================

SELECT * FROM public.certificates ORDER BY created_at;
SELECT * FROM public.certificate_subscriptions ORDER BY created_at;
SELECT * FROM public.certificate_shares ORDER BY created_at;

-- ============================================
-- ÉTAPE 6: EXPORT KYC
-- ============================================

SELECT * FROM public.kyc_requests ORDER BY created_at;
SELECT * FROM public.kyc_documents ORDER BY created_at;
SELECT * FROM public.aml_screenings ORDER BY created_at;
SELECT * FROM public.phone_verifications ORDER BY created_at;

-- ============================================
-- ÉTAPE 7: EXPORT SCORING
-- ============================================

SELECT * FROM public.scoring_requests ORDER BY created_at;
SELECT * FROM public.data_enrichments ORDER BY created_at;
SELECT * FROM public.data_consents ORDER BY created_at;

-- ============================================
-- ÉTAPE 8: EXPORT API KEYS & WEBHOOKS
-- ============================================

SELECT * FROM public.api_keys ORDER BY created_at;
SELECT * FROM public.webhooks ORDER BY created_at;
SELECT * FROM public.api_calls ORDER BY created_at LIMIT 10000;

-- ============================================
-- ÉTAPE 9: EXPORT PAIEMENTS & FACTURES
-- ============================================

SELECT * FROM public.payment_transactions ORDER BY created_at;
SELECT * FROM public.invoices ORDER BY created_at;

-- ============================================
-- ÉTAPE 10: EXPORT NOTIFICATIONS & LOGS
-- ============================================

SELECT * FROM public.notifications ORDER BY created_at;
SELECT * FROM public.audit_logs ORDER BY created_at LIMIT 50000;

-- ============================================
-- ÉTAPE 11: EXPORT SÉCURITÉ
-- ============================================

SELECT * FROM public.identity_fraud_risk ORDER BY created_at;
SELECT * FROM public.security_alerts ORDER BY created_at;
SELECT * FROM public.blacklisted_ips ORDER BY created_at;

-- ============================================
-- ÉTAPE 12: EXPORT CONFIGURATION
-- ============================================

SELECT * FROM public.settings ORDER BY created_at;
SELECT * FROM public.system_security_controls;
SELECT * FROM public.system_lockdown_state;
SELECT * FROM public.access_passwords ORDER BY created_at;

-- ============================================
-- STATISTIQUES D'EXPORT
-- ============================================

SELECT 'RÉSUMÉ EXPORT WOUAKA' as info;
SELECT 'Utilisateurs' as table_name, COUNT(*) as count FROM auth.users
UNION ALL SELECT 'Profils', COUNT(*) FROM public.profiles
UNION ALL SELECT 'Rôles', COUNT(*) FROM public.user_roles
UNION ALL SELECT 'Abonnements', COUNT(*) FROM public.subscriptions
UNION ALL SELECT 'Certificats', COUNT(*) FROM public.certificates
UNION ALL SELECT 'KYC Requests', COUNT(*) FROM public.kyc_requests
UNION ALL SELECT 'Scoring Requests', COUNT(*) FROM public.scoring_requests
UNION ALL SELECT 'API Keys', COUNT(*) FROM public.api_keys
UNION ALL SELECT 'Paiements', COUNT(*) FROM public.payment_transactions
UNION ALL SELECT 'Notifications', COUNT(*) FROM public.notifications;
