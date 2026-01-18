/**
 * Classes d'erreurs personnalisées pour le SDK Wouaka
 */

export class WouakaError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = 'WouakaError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;

    // Maintenir la stack trace correcte
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WouakaError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      requestId: this.requestId,
    };
  }
}

/**
 * Erreur d'authentification (401)
 */
export class AuthenticationError extends WouakaError {
  constructor(message = 'Clé API invalide ou expirée', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erreur d'autorisation (403)
 */
export class AuthorizationError extends WouakaError {
  constructor(message = 'Permission insuffisante pour cette opération', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Erreur de validation (400)
 */
export class ValidationError extends WouakaError {
  public readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Ressource non trouvée (404)
 */
export class NotFoundError extends WouakaError {
  constructor(message = 'Ressource non trouvée', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Limite de taux dépassée (429)
 */
export class RateLimitError extends WouakaError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(
    message = 'Limite de requêtes dépassée',
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, {
      retry_after: retryAfter,
      limit,
      remaining,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Erreur de quota (402)
 */
export class QuotaExceededError extends WouakaError {
  constructor(message = 'Quota de requêtes épuisé, veuillez mettre à niveau votre plan', details?: Record<string, unknown>) {
    super(message, 'QUOTA_EXCEEDED', 402, details);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Erreur serveur (500)
 */
export class ServerError extends WouakaError {
  constructor(message = 'Erreur serveur interne', requestId?: string, details?: Record<string, unknown>) {
    super(message, 'SERVER_ERROR', 500, details, requestId);
    this.name = 'ServerError';
  }
}

/**
 * Erreur de timeout
 */
export class TimeoutError extends WouakaError {
  constructor(message = 'La requête a expiré', timeout?: number) {
    super(message, 'TIMEOUT', 408, { timeout_ms: timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Erreur réseau
 */
export class NetworkError extends WouakaError {
  constructor(message = 'Erreur de connexion réseau', originalError?: Error) {
    super(message, 'NETWORK_ERROR', undefined, {
      original_error: originalError?.message,
    });
    this.name = 'NetworkError';
  }
}

/**
 * Source de données indisponible
 */
export class DataSourceUnavailableError extends WouakaError {
  public readonly source: string;

  constructor(source: string, message?: string) {
    super(
      message || `La source de données '${source}' est temporairement indisponible`,
      'DATA_SOURCE_UNAVAILABLE',
      503,
      { source }
    );
    this.name = 'DataSourceUnavailableError';
    this.source = source;
  }
}

/**
 * Consentement requis
 */
export class ConsentRequiredError extends WouakaError {
  constructor(message = 'Le consentement du client est requis pour cette opération') {
    super(message, 'CONSENT_REQUIRED', 403);
    this.name = 'ConsentRequiredError';
  }
}

/**
 * Mapper une erreur HTTP en erreur typée
 */
export function mapHttpError(
  statusCode: number,
  body: { code?: string; message?: string; details?: Record<string, unknown> },
  requestId?: string
): WouakaError {
  const message = body.message || 'Une erreur est survenue';
  const details = body.details;

  switch (statusCode) {
    case 400:
      return new ValidationError(message, undefined, details);
    case 401:
      return new AuthenticationError(message, details);
    case 402:
      return new QuotaExceededError(message, details);
    case 403:
      if (body.code === 'CONSENT_REQUIRED') {
        return new ConsentRequiredError(message);
      }
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 429:
      return new RateLimitError(message);
    case 503:
      if (body.code === 'DATA_SOURCE_UNAVAILABLE') {
        return new DataSourceUnavailableError(
          (details?.source as string) || 'unknown',
          message
        );
      }
      return new ServerError(message, requestId, details);
    default:
      if (statusCode >= 500) {
        return new ServerError(message, requestId, details);
      }
      return new WouakaError(message, body.code || 'UNKNOWN_ERROR', statusCode, details, requestId);
  }
}
