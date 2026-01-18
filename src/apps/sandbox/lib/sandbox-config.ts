/**
 * Sandbox Configuration
 * URLs and constants specific to the developer portal
 */

export const SANDBOX_CONFIG = {
  name: 'WOUAKA Developer Portal',
  tagline: 'Portail Développeur',
  version: '2.0',
} as const;

// Main site URLs (for cross-linking)
export const MAIN_SITE_URL = 'https://www.wouaka-creditscore.com';
export const API_URL = 'https://api.wouaka-creditscore.com';
export const SANDBOX_URL = 'https://sandbox.wouaka-creditscore.com';

/**
 * Get the main site URL
 */
export function getMainSiteUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${MAIN_SITE_URL}${cleanPath}`;
}

/**
 * Get API URL
 */
export function getApiUrl(version: string = 'v1', endpoint: string = ''): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : endpoint ? `/${endpoint}` : '';
  return `${API_URL}/${version}${cleanEndpoint}`;
}

/**
 * Check if we're on the sandbox subdomain
 */
export function isSandboxDomain(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('sandbox.');
}

/**
 * Developer menu items for navigation
 */
export const DEVELOPER_NAV_ITEMS = [
  { label: 'Documentation', href: '/', icon: 'BookOpen' },
  { label: 'Sandbox', href: '/sandbox', icon: 'Play' },
  { label: 'Status', href: '/status', icon: 'Activity' },
  { label: 'Webhooks', href: '/webhooks', icon: 'Webhook' },
  { label: 'API Reference', href: '/api-reference', icon: 'FileJson' },
] as const;
