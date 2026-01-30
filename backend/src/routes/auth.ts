// ============================================
// WOUAKA - Authentication Routes
// ============================================
// JWT-based authentication to replace Supabase Auth
// ============================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { query, queryOne, withTransaction } from '../config/database.js';
import { generateToken, generateRefreshToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (min 8 caractères)'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['EMPRUNTEUR', 'PARTENAIRE']).optional().default('EMPRUNTEUR'),
});

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// ============================================
// SIGN UP
// ============================================
router.post('/signup', strictRateLimiter(5), async (req: Request, res: Response) => {
  try {
    const data = signUpSchema.parse(req.body);
    
    // Check if email already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );
    
    if (existing) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cet email est déjà utilisé',
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = uuidv4();
    
    // Create user in transaction
    await withTransaction(async (client) => {
      // Insert into users table
      await client.query(
        `INSERT INTO users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [
          userId,
          data.email.toLowerCase(),
          passwordHash,
          JSON.stringify({ full_name: data.fullName, phone: data.phone, role: data.role }),
        ]
      );
      
      // Insert profile
      await client.query(
        `INSERT INTO profiles (id, email, full_name, phone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [userId, data.email.toLowerCase(), data.fullName || '', data.phone || '']
      );
      
      // Insert role
      await client.query(
        `INSERT INTO user_roles (user_id, role, granted_at)
         VALUES ($1, $2, NOW())`,
        [userId, data.role]
      );
    });
    
    // Generate tokens
    const token = generateToken({ id: userId, email: data.email, role: data.role });
    const refreshToken = generateRefreshToken(userId);
    
    res.status(201).json({
      success: true,
      user: {
        id: userId,
        email: data.email,
        role: data.role,
      },
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.errors[0].message,
      });
    }
    throw error;
  }
});

// ============================================
// SIGN IN
// ============================================
router.post('/signin', strictRateLimiter(10), async (req: Request, res: Response) => {
  try {
    const data = signInSchema.parse(req.body);
    
    // Find user
    const user = await queryOne<{
      id: string;
      email: string;
      encrypted_password: string;
    }>(
      'SELECT id, email, encrypted_password FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.encrypted_password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
      });
    }
    
    // Get role
    const roleResult = await queryOne<{ role: string }>(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY granted_at LIMIT 1',
      [user.id]
    );
    const role = roleResult?.role || 'EMPRUNTEUR';
    
    // Get profile
    const profile = await queryOne(
      'SELECT * FROM profiles WHERE id = $1',
      [user.id]
    );
    
    // Update last sign in
    await query(
      'UPDATE users SET last_sign_in_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate tokens
    const token = generateToken({ id: user.id, email: user.email, role });
    const refreshToken = generateRefreshToken(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
      profile,
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.errors[0].message,
      });
    }
    throw error;
  }
});

// ============================================
// GET CURRENT USER
// ============================================
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const profile = await queryOne(
    'SELECT * FROM profiles WHERE id = $1',
    [req.user.id]
  );
  
  res.json({
    user: req.user,
    profile,
  });
});

// ============================================
// REFRESH TOKEN
// ============================================
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Refresh token required',
    });
  }
  
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(
      refreshToken,
      process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars'
    ) as { sub: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Get user and role
    const user = await queryOne<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.sub]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const roleResult = await queryOne<{ role: string }>(
      'SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1',
      [user.id]
    );
    
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: roleResult?.role || 'EMPRUNTEUR',
    });
    
    res.json({
      accessToken: newToken,
    });
  } catch {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
  }
});

// ============================================
// PASSWORD RESET REQUEST
// ============================================
router.post('/reset-password', strictRateLimiter(3), async (req: Request, res: Response) => {
  const { email } = req.body;
  
  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
  });
  
  // TODO: Send email with reset link
});

// ============================================
// UPDATE PASSWORD
// ============================================
router.post('/update-password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Mot de passe trop court (min 8 caractères)',
    });
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  await query(
    'UPDATE users SET encrypted_password = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, req.user!.id]
  );
  
  res.json({ success: true });
});

// ============================================
// SIGN OUT (invalidate session)
// ============================================
router.post('/signout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Add token to blacklist if needed
  res.json({ success: true });
});

export default router;
