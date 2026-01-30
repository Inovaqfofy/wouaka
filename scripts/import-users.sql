-- ============================================
-- WOUAKA - USER IMPORT SCRIPT
-- ============================================
-- Import users exported from Supabase
-- Run this after exporting data
-- ============================================

-- ============================================
-- TABLE: users (replaces auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB DEFAULT '{}',
  raw_app_meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sign_in_at TIMESTAMPTZ,
  confirmation_token TEXT,
  recovery_token TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- TABLE: otp_verifications (for phone OTP)
-- ============================================
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- ============================================
-- IMPORT INSTRUCTIONS
-- ============================================
-- 
-- 1. Export from Supabase SQL Editor:
--    Run: scripts/export-supabase-data.sql
--    Save results as CSV files
--
-- 2. Copy the exported auth.users data here:
--    (Replace this comment with INSERT statements)
--
-- Example:
-- INSERT INTO public.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at)
-- VALUES 
--   ('uuid-1', 'user1@example.com', '$2a$10$...', '2024-01-01', '{"full_name":"User 1"}', '2024-01-01'),
--   ('uuid-2', 'user2@example.com', '$2a$10$...', '2024-01-02', '{"full_name":"User 2"}', '2024-01-02');
--
-- ============================================

-- Placeholder: Add your exported users here
-- The bcrypt hashes from Supabase will work directly with bcryptjs in Node.js

-- ============================================
-- VERIFY IMPORT
-- ============================================
-- Run these queries after import to verify:
--
-- SELECT COUNT(*) as total_users FROM public.users;
-- SELECT COUNT(*) as total_profiles FROM public.profiles;
-- SELECT COUNT(*) as total_roles FROM public.user_roles;
--
-- SELECT u.email, p.full_name, ur.role 
-- FROM public.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- LIMIT 10;
