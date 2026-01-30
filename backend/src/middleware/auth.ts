// ============================================
// WOUAKA - JWT Authentication Middleware
// ============================================
// Custom JWT auth to replace Supabase Auth
// ============================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export interface JwtPayload {
  sub: string;         // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars';

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
}

// Middleware for admin-only routes
export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
  next();
}

// Middleware for partner routes
export function partnerMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const partnerRoles = ['PARTENAIRE', 'ENTREPRISE', 'ANALYSTE', 'API_CLIENT', 'SUPER_ADMIN'];
  if (!req.user || !partnerRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Partner access required',
    });
  }
  next();
}

// API Key authentication for external integrations
export async function apiKeyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required',
    });
  }
  
  try {
    // Verify API key in database
    const result = await query<{ user_id: string; permissions: any }>(
      `SELECT ak.user_id, ak.permissions, ur.role
       FROM api_keys ak
       JOIN user_roles ur ON ur.user_id = ak.user_id
       WHERE ak.key_hash = encode(sha256($1::bytea), 'hex')
       AND ak.is_active = true
       AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key',
      });
    }
    
    const keyData = result.rows[0];
    
    req.user = {
      id: keyData.user_id,
      email: '',
      role: 'API_CLIENT',
    };
    
    // Update last used
    await query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = encode(sha256($1::bytea), \'hex\')',
      [apiKey]
    );
    
    next();
  } catch (error) {
    console.error('[Auth] API key validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication error',
    });
  }
}

// Generate JWT token
export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
