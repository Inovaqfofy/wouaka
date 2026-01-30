/**
 * @wouaka/sdk - SDK officiel Wouaka
 * Credit Scoring, KYC et Vérification d'Identité pour l'Afrique de l'Ouest
 * 
 * @example
 * ```typescript
 * import { WouakaClient } from '@wouaka/sdk';
 * 
 * const wouaka = new WouakaClient({
 *   apiKey: 'wk_live_xxx',
 *   environment: 'production'
 * });
 * 
 * const score = await wouaka.scores.calculate({
 *   phone_number: '+22507XXXXXXXX',
 *   full_name: 'Kouassi Jean'
 * });
 * ```
 */

export * from './client';
export * from './types';
export * from './errors';
export * from './utils';

// Default export
export { WouakaClient as default } from './client';
