/**
 * ============================================
 * WOUAKA APPLICATION CONFIGURATION
 * Centralized URL and environment configuration
 * ============================================
 * 
 * This file serves as the single source of truth for all
 * application URLs and environment-specific configuration.
 * 
 * @version 1.0.0
 * @production https://www.wouaka-creditscore.com
 */

// ============================================
// PRODUCTION DOMAIN CONFIGURATION
// ============================================

/**
 * Primary production domain with www prefix
 */
export const PRODUCTION_DOMAIN = 'https://www.wouaka-creditscore.com';

/**
 * API subdomain for external partner integrations
 */
export const API_DOMAIN = 'https://api.wouaka-creditscore.com';

/**
 * Sandbox subdomain for testing
 */
export const SANDBOX_DOMAIN = 'https://sandbox.wouaka-creditscore.com';

// ============================================
// SITE METADATA
// ============================================

export const SITE_CONFIG = {
  name: 'Wouaka',
  tagline: 'Certification de Solvabilité Souveraine',
  description: 'Plateforme de certification de solvabilité souveraine pour l\'Afrique de l\'Ouest',
  locale: 'fr_FR',
  currency: 'XOF',
  region: 'UEMOA',
} as const;

// ============================================
// LEGAL & CONTACT
// ============================================

export const COMPANY_INFO = {
  legalName: 'Inopay Group SARL',
  rccm: 'CI-ABJ-03-2023-B13-03481',
  address: '27 BP 148 Abidjan 27, Côte d\'Ivoire',
  phone: '+225 07 01 23 89 74',
  email: 'contact@wouaka-creditscore.com',
  supportEmail: 'support@wouaka-creditscore.com',
} as const;

// ============================================
// URL GENERATORS
// ============================================

/**
 * Get the base URL for the current environment
 * Uses window.location.origin for dynamic environments,
 * falls back to production domain
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // In browser, use current origin for proper routing
    return window.location.origin;
  }
  return PRODUCTION_DOMAIN;
}

/**
 * Generate an absolute URL for the application
 */
export function getAbsoluteUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Get production URL (always returns the canonical domain)
 */
export function getProductionUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
}

/**
 * Generate API endpoint URL
 */
export function getApiUrl(version: string = 'v1', endpoint: string = ''): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : endpoint ? `/${endpoint}` : '';
  return `${API_DOMAIN}/${version}${cleanEndpoint}`;
}

// ============================================
// LEGAL PAGE URLS
// ============================================

export const LEGAL_URLS = {
  terms: getProductionUrl('/terms'),
  privacy: getProductionUrl('/privacy'),
  legal: getProductionUrl('/legal'),
  license: getProductionUrl('/license'),
  contact: getProductionUrl('/contact'),
} as const;

// ============================================
// ERROR TYPE URLS (RFC 7807)
// ============================================

export const ERROR_TYPE_URLS = {
  badRequest: getProductionUrl('/errors/bad-request'),
  unauthorized: getProductionUrl('/errors/unauthorized'),
  forbidden: getProductionUrl('/errors/forbidden'),
  notFound: getProductionUrl('/errors/not-found'),
  validation: getProductionUrl('/errors/validation'),
  rateLimited: getProductionUrl('/errors/rate-limited'),
  internal: getProductionUrl('/errors/internal'),
} as const;

// ============================================
// ASSET URLS
// ============================================

export const ASSET_URLS = {
  logo: getProductionUrl('/logo.png'),
  ogImage: getProductionUrl('/og-banner.png'),
  ogBanner: getProductionUrl('/og-banner.png'),
  favicon: getProductionUrl('/favicon.ico'),
  faviconPng: getProductionUrl('/favicon.png'),
  pwa192: getProductionUrl('/pwa-192x192.png'),
  pwa512: getProductionUrl('/pwa-512x512.png'),
} as const;

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_URLS = {
  facebook: 'https://facebook.com/wouaka',
  linkedin: 'https://linkedin.com/company/wouaka',
  instagram: 'https://instagram.com/wouaka',
  twitter: 'https://x.com/wouaka',
} as const;

// ============================================
// SUPABASE CONFIGURATION
// ============================================

/**
 * Get Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

/**
 * Get Edge Function URL
 */
export function getEdgeFunctionUrl(functionName: string): string {
  return `${getSupabaseUrl()}/functions/v1/${functionName}`;
}

// ============================================
// ENVIRONMENT DETECTION
// ============================================

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'www.wouaka-creditscore.com' ||
         window.location.hostname === 'wouaka-creditscore.com';
}

/**
 * Check if running in development/preview
 */
export function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('lovable.app') ||
         window.location.hostname === 'localhost';
}

// ============================================
// LOGO BASE64 FOR PDF EXPORT
// ============================================

/**
 * Wouaka logo as Base64 for reliable PDF export
 * Prevents broken images when exporting certificates
 */
export const WOUAKA_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAxLTE1VDEwOjAwOjAwKzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMCswMTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMCswMTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6d291YWthLWxvZ28iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6d291YWthLWxvZ28iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDp3b3Vha2EtbG9nbyI+PC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4K';

/**
 * Security seal badge for certificates
 */
export const SECURITY_SEAL_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzNkNWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTAiLz48cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+PC9zdmc+';

/**
 * BCEAO compliance badge
 */
export const BCEAO_BADGE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlOGI5M2EiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiA2djZsNCAyIi8+PC9zdmc+';
