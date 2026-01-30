/**
 * WOUAKA SDK Client Factory
 * Singleton instance for the @wouaka/sdk in React applications
 * 
 * This module provides a centralized, typed SDK client that uses
 * the user's API key from Supabase or environment variables.
 */

import { WouakaSDK } from '@wouaka/sdk';

// Singleton instance
let sdkInstance: WouakaSDK | null = null;
let currentApiKey: string | null = null;

/**
 * Get environment-specific base URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_WOUAKA_API_URL 
    || (import.meta.env.DEV 
      ? 'https://sandbox.wouaka-creditscore.com/functions/v1'
      : 'https://api.wouaka-creditscore.com/functions/v1');
}

/**
 * Initialize or get the SDK client instance
 * @param apiKey - The API key to use (wk_live_xxx or wk_test_xxx)
 * @returns Configured WouakaSDK instance
 */
export function getWouakaClient(apiKey: string): WouakaSDK {
  // Return existing instance if API key matches
  if (sdkInstance && currentApiKey === apiKey) {
    return sdkInstance;
  }

  // Create new instance with the provided API key
  sdkInstance = new WouakaSDK(apiKey, getApiBaseUrl());
  currentApiKey = apiKey;

  return sdkInstance;
}

/**
 * Clear the SDK instance (useful for logout)
 */
export function clearWouakaClient(): void {
  sdkInstance = null;
  currentApiKey = null;
}

/**
 * Check if SDK is initialized
 */
export function isWouakaClientInitialized(): boolean {
  return sdkInstance !== null;
}

/**
 * SDK Error types for better error handling
 */
export type WouakaSdkErrorType = 
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface WouakaSdkError {
  type: WouakaSdkErrorType;
  message: string;
  code?: string;
  retryAfter?: number;
}

/**
 * Parse SDK errors into a normalized format
 */
export function parseWouakaSdkError(error: unknown): WouakaSdkError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return { type: 'AUTHENTICATION_ERROR', message: 'Clé API invalide ou expirée' };
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return { 
        type: 'RATE_LIMIT_ERROR', 
        message: 'Limite de requêtes atteinte. Veuillez réessayer.',
        retryAfter: 60
      };
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return { type: 'VALIDATION_ERROR', message: error.message };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return { type: 'NETWORK_ERROR', message: 'Erreur de connexion réseau' };
    }
    
    if (message.includes('500') || message.includes('server')) {
      return { type: 'SERVER_ERROR', message: 'Erreur serveur. Veuillez réessayer.' };
    }
    
    return { type: 'UNKNOWN_ERROR', message: error.message };
  }
  
  return { type: 'UNKNOWN_ERROR', message: 'Une erreur inconnue est survenue' };
}
