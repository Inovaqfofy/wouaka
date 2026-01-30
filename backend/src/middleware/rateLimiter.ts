// ============================================
// WOUAKA - Rate Limiting Middleware
// ============================================
// In-memory rate limiting (use Redis in production cluster)
// ============================================

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;    // 100 requests per minute
const SCORING_LIMIT = 10;    // 10 scoring requests per minute

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.path;
  const key = `${ip}:${path}`;
  const now = Date.now();
  
  // Determine limit based on endpoint
  let limit = MAX_REQUESTS;
  if (path.includes('/scoring') || path.includes('/calculate')) {
    limit = SCORING_LIMIT;
  }
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000));
    
    return next();
  }
  
  if (entry.count >= limit) {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
    res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
  }
  
  entry.count++;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
  
  next();
}

// Stricter limit for sensitive operations
export function strictRateLimiter(limit: number = 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `strict:${ip}:${req.path}`;
    const now = Date.now();
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS * 5, // 5 minute window
      });
      return next();
    }
    
    if (entry.count >= limit) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many attempts. Please wait before trying again.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }
    
    entry.count++;
    next();
  };
}
