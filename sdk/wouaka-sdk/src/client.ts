/**
 * Client principal du SDK Wouaka
 */

import {
  WouakaConfig,
  ScoreRequest,
  ScoreResponse,
  KycRequest,
  KycResponse,
  IdentityRequest,
  IdentityResponse,
  PrecheckRequest,
  PrecheckResponse,
  WebhookConfig,
  Webhook,
  WebhookDelivery,
  ApiResponse,
  RateLimitInfo,
  PaginatedResponse,
} from './types';

import {
  WouakaError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  mapHttpError,
} from './errors';

import { calculateBackoff, sleep } from './utils';

const DEFAULT_BASE_URL = 'https://api.wouaka-creditscore.com';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;

export class WouakaClient {
  private readonly config: Required<WouakaConfig>;
  private rateLimitInfo?: RateLimitInfo;

  constructor(config: WouakaConfig) {
    if (!config.apiKey) {
      throw new AuthenticationError('La clé API est requise');
    }

    this.config = {
      apiKey: config.apiKey,
      environment: config.environment || 'production',
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      retries: config.retries ?? DEFAULT_RETRIES,
    };
  }

  // ============================================
  // HTTP Client
  // ============================================

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: { retries?: number; timeout?: number } = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const retries = options.retries ?? this.config.retries;
    const timeout = options.timeout ?? this.config.timeout;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'X-SDK-Version': '1.0.0',
            'X-SDK-Language': 'javascript',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Extraire les infos de rate limiting
        this.rateLimitInfo = {
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10),
          reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10),
        };

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
          const requestId = response.headers.get('X-Request-Id') || undefined;
          throw mapHttpError(response.status, responseData, requestId);
        }

        return responseData as T;
      } catch (error) {
        lastError = error as Error;

        // Ne pas réessayer pour certaines erreurs
        if (
          error instanceof AuthenticationError ||
          error instanceof WouakaError && error.statusCode === 400
        ) {
          throw error;
        }

        // Erreur de timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new TimeoutError('La requête a expiré', timeout);
        }

        // Erreur réseau
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = new NetworkError('Erreur de connexion', error);
        }

        // Rate limit - attendre avant retry
        if (error instanceof RateLimitError && error.retryAfter) {
          await sleep(error.retryAfter * 1000);
          continue;
        }

        // Backoff exponentiel pour autres erreurs
        if (attempt < retries) {
          await sleep(calculateBackoff(attempt));
        }
      }
    }

    throw lastError || new WouakaError('Erreur inconnue', 'UNKNOWN_ERROR');
  }

  /**
   * Obtenir les informations de rate limiting
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  // ============================================
  // W-SCORE API
  // ============================================

  readonly scores = {
    /**
     * Calculer le score de crédit d'un client
     * 
     * @example
     * ```typescript
     * const result = await wouaka.scores.calculate({
     *   phone_number: '+22507XXXXXXXX',
     *   full_name: 'Kouassi Jean',
     *   country: 'CI'
     * });
     * console.log(result.score, result.grade);
     * ```
     */
    calculate: async (data: ScoreRequest): Promise<ScoreResponse> => {
      return this.request<ScoreResponse>('POST', '/v1/scores', data);
    },

    /**
     * Récupérer un score par son ID
     */
    get: async (scoreId: string): Promise<ScoreResponse> => {
      return this.request<ScoreResponse>('GET', `/v1/scores/${scoreId}`);
    },

    /**
     * Lister l'historique des scores
     */
    list: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<ScoreResponse>> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.per_page) query.set('per_page', params.per_page.toString());
      const queryString = query.toString();
      return this.request<PaginatedResponse<ScoreResponse>>(
        'GET',
        `/v1/scores${queryString ? `?${queryString}` : ''}`
      );
    },
  };

  // ============================================
  // W-KYC API
  // ============================================

  readonly kyc = {
    /**
     * Effectuer une vérification KYC
     * 
     * @example
     * ```typescript
     * const result = await wouaka.kyc.verify({
     *   full_name: 'Kouassi Jean',
     *   national_id: 'CI-XXXXXXXXX',
     *   phone_number: '+22507XXXXXXXX'
     * });
     * console.log(result.verified, result.risk_level);
     * ```
     */
    verify: async (data: KycRequest): Promise<KycResponse> => {
      return this.request<KycResponse>('POST', '/v1/kyc/verify', data);
    },

    /**
     * Récupérer une vérification KYC par son ID
     */
    get: async (kycId: string): Promise<KycResponse> => {
      return this.request<KycResponse>('GET', `/v1/kyc/${kycId}`);
    },

    /**
     * Lister l'historique des vérifications KYC
     */
    list: async (params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<KycResponse>> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.per_page) query.set('per_page', params.per_page.toString());
      if (params?.status) query.set('status', params.status);
      const queryString = query.toString();
      return this.request<PaginatedResponse<KycResponse>>(
        'GET',
        `/v1/kyc${queryString ? `?${queryString}` : ''}`
      );
    },
  };

  // ============================================
  // Identity API
  // ============================================

  readonly identity = {
    /**
     * Vérifier l'identité d'une personne
     * 
     * @example
     * ```typescript
     * const result = await wouaka.identity.lookup({
     *   phone_number: '+22507XXXXXXXX',
     *   national_id: 'CI-XXXXXXXXX'
     * });
     * ```
     */
    lookup: async (data: IdentityRequest): Promise<IdentityResponse> => {
      return this.request<IdentityResponse>('POST', '/v1/identity/lookup', data);
    },

    /**
     * Récupérer une recherche d'identité par son ID
     */
    get: async (identityId: string): Promise<IdentityResponse> => {
      return this.request<IdentityResponse>('GET', `/v1/identity/${identityId}`);
    },
  };

  // ============================================
  // Precheck API
  // ============================================

  readonly precheck = {
    /**
     * Effectuer une vérification rapide (precheck)
     * 
     * @example
     * ```typescript
     * const result = await wouaka.precheck.check({
     *   phone_number: '+22507XXXXXXXX',
     *   full_name: 'Kouassi Jean'
     * });
     * if (result.eligible) {
     *   // Procéder à l'évaluation complète
     * }
     * ```
     */
    check: async (data: PrecheckRequest): Promise<PrecheckResponse> => {
      return this.request<PrecheckResponse>('POST', '/v1/precheck', data);
    },
  };

  // ============================================
  // Webhooks API
  // ============================================

  readonly webhooks = {
    /**
     * Créer un nouveau webhook
     */
    create: async (config: WebhookConfig): Promise<Webhook> => {
      return this.request<Webhook>('POST', '/v1/webhooks', config);
    },

    /**
     * Lister tous les webhooks
     */
    list: async (): Promise<Webhook[]> => {
      const response = await this.request<{ webhooks: Webhook[] }>('GET', '/v1/webhooks');
      return response.webhooks;
    },

    /**
     * Récupérer un webhook par son ID
     */
    get: async (webhookId: string): Promise<Webhook> => {
      return this.request<Webhook>('GET', `/v1/webhooks/${webhookId}`);
    },

    /**
     * Mettre à jour un webhook
     */
    update: async (webhookId: string, config: Partial<WebhookConfig>): Promise<Webhook> => {
      return this.request<Webhook>('PATCH', `/v1/webhooks/${webhookId}`, config);
    },

    /**
     * Supprimer un webhook
     */
    delete: async (webhookId: string): Promise<void> => {
      await this.request<void>('DELETE', `/v1/webhooks/${webhookId}`);
    },

    /**
     * Tester un webhook
     */
    test: async (webhookId: string): Promise<{ success: boolean; response_code?: number }> => {
      return this.request('POST', `/v1/webhooks/${webhookId}/test`);
    },

    /**
     * Lister les livraisons d'un webhook
     */
    getDeliveries: async (webhookId: string, params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<WebhookDelivery>> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.per_page) query.set('per_page', params.per_page.toString());
      const queryString = query.toString();
      return this.request<PaginatedResponse<WebhookDelivery>>(
        'GET',
        `/v1/webhooks/${webhookId}/deliveries${queryString ? `?${queryString}` : ''}`
      );
    },
  };

  // ============================================
  // API Keys Management
  // ============================================

  readonly apiKeys = {
    /**
     * Lister toutes les clés API
     */
    list: async (): Promise<{ id: string; name: string; prefix: string; created_at: string; last_used_at?: string; expires_at?: string }[]> => {
      const response = await this.request<{ keys: any[] }>('GET', '/v1/api-keys');
      return response.keys;
    },

    /**
     * Créer une nouvelle clé API
     */
    create: async (name: string, permissions?: string[], expiresInDays?: number): Promise<{ key: string; id: string }> => {
      return this.request('POST', '/v1/api-keys', {
        name,
        permissions,
        expires_in_days: expiresInDays,
      });
    },

    /**
     * Révoquer une clé API
     */
    revoke: async (keyId: string): Promise<void> => {
      await this.request<void>('DELETE', `/v1/api-keys/${keyId}`);
    },

    /**
     * Rotation d'une clé API
     */
    rotate: async (keyId: string): Promise<{ key: string; id: string }> => {
      return this.request('POST', `/v1/api-keys/${keyId}/rotate`);
    },
  };

  // ============================================
  // Usage & Billing
  // ============================================

  readonly usage = {
    /**
     * Obtenir les statistiques d'utilisation
     */
    getStats: async (params?: { start_date?: string; end_date?: string }): Promise<{
      period: { start: string; end: string };
      total_requests: number;
      scores_calculated: number;
      kyc_verifications: number;
      identity_lookups: number;
      prechecks: number;
    }> => {
      const query = new URLSearchParams();
      if (params?.start_date) query.set('start_date', params.start_date);
      if (params?.end_date) query.set('end_date', params.end_date);
      const queryString = query.toString();
      return this.request('GET', `/v1/usage${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Obtenir les quotas du plan actuel
     */
    getQuota: async (): Promise<{
      plan: string;
      requests_limit: number;
      requests_used: number;
      requests_remaining: number;
      reset_at: string;
    }> => {
      return this.request('GET', '/v1/usage/quota');
    },
  };
}

// Export par défaut
export default WouakaClient;
