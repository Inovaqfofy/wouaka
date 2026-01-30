// ============================================
// WOUAKA - Scoring Routes
// ============================================
// Credit scoring API endpoints
// ============================================

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/database.js';
import { AuthenticatedRequest, apiKeyMiddleware } from '../middleware/auth.js';

const router = Router();

// Scoring request schema
const scoringSchema = z.object({
  phone_number: z.string().min(8),
  full_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  country: z.string().default('CI'),
  data_sources: z.array(z.string()).optional(),
  phone_verified: z.boolean().optional(),
});

// ============================================
// CALCULATE SCORE
// ============================================
router.post('/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = scoringSchema.parse(req.body);
    const userId = req.user!.id;
    const startTime = Date.now();
    
    // Create scoring request
    const requestId = uuidv4();
    
    await query(
      `INSERT INTO scoring_requests 
       (id, user_id, phone_number, full_name, country, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'processing', NOW())`,
      [requestId, userId, input.phone_number, input.full_name || '', input.country]
    );
    
    // ==============================
    // SCORING ENGINE (Sovereign Model)
    // ==============================
    
    let rawScore = 50; // Base score
    let confidence = 0.3;
    const factors: any[] = [];
    const proofCoefficients: number[] = [];
    
    // 1. Phone verification bonus
    if (input.phone_verified) {
      rawScore += 15;
      confidence += 0.2;
      proofCoefficients.push(1.0); // Hard proof
      factors.push({
        factor: 'phone_verified',
        impact: +15,
        coefficient: 1.0,
        source: 'otp_verification',
      });
    } else {
      rawScore -= 15;
      proofCoefficients.push(0.3); // Declarative only
      factors.push({
        factor: 'phone_not_verified',
        impact: -15,
        coefficient: 0.3,
        source: 'declarative',
      });
    }
    
    // 2. Name provided bonus
    if (input.full_name && input.full_name.length > 3) {
      rawScore += 5;
      factors.push({
        factor: 'name_provided',
        impact: +5,
        coefficient: 0.3,
        source: 'declarative',
      });
    }
    
    // 3. Date of birth bonus
    if (input.date_of_birth) {
      rawScore += 5;
      factors.push({
        factor: 'dob_provided',
        impact: +5,
        coefficient: 0.3,
        source: 'declarative',
      });
    }
    
    // Calculate average coefficient
    const avgCoefficient = proofCoefficients.length > 0
      ? proofCoefficients.reduce((a, b) => a + b, 0) / proofCoefficients.length
      : 0.3;
    
    // Apply caps based on proof quality
    if (avgCoefficient < 0.5) {
      rawScore = Math.min(55, rawScore); // Cap for declarative data
    } else if (avgCoefficient < 0.7) {
      rawScore = Math.min(70, rawScore); // Cap for mixed quality
    }
    
    // Ensure score is within bounds
    const finalScore = Math.max(30, Math.min(100, Math.round(rawScore)));
    
    // Determine risk category
    let riskCategory = 'medium';
    if (finalScore >= 75) riskCategory = 'low';
    else if (finalScore >= 60) riskCategory = 'medium';
    else if (finalScore >= 45) riskCategory = 'elevated';
    else riskCategory = 'high';
    
    const processingTime = Date.now() - startTime;
    
    // Update scoring request
    await query(
      `UPDATE scoring_requests 
       SET status = 'completed', 
           score = $2, 
           confidence = $3,
           risk_category = $4,
           factors = $5,
           processing_time_ms = $6,
           updated_at = NOW()
       WHERE id = $1`,
      [requestId, finalScore, confidence, riskCategory, JSON.stringify(factors), processingTime]
    );
    
    res.json({
      success: true,
      request_id: requestId,
      score: finalScore,
      confidence: Math.round(confidence * 100),
      certainty_coefficient: avgCoefficient,
      risk_category: riskCategory,
      factors,
      processing_time_ms: processingTime,
      recommendation: riskCategory === 'low' || riskCategory === 'medium' 
        ? 'approved' 
        : 'manual_review',
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
// GET SCORING HISTORY
// ============================================
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  
  const result = await query(
    `SELECT * FROM scoring_requests 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  res.json({
    requests: result.rows,
    pagination: {
      limit,
      offset,
      total: result.rowCount,
    },
  });
});

// ============================================
// GET SINGLE SCORING REQUEST
// ============================================
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  const request = await queryOne(
    'SELECT * FROM scoring_requests WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (!request) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Scoring request not found',
    });
  }
  
  res.json(request);
});

// ============================================
// PARTNER API - Calculate Score with API Key
// ============================================
router.post('/v1/calculate', apiKeyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // Same logic as /calculate but for API clients
  // Reuse the same scoring engine
  
  try {
    const input = scoringSchema.parse(req.body);
    const partnerId = req.user!.id;
    const startTime = Date.now();
    
    const requestId = uuidv4();
    
    // Simplified scoring for API
    let score = 50;
    if (input.phone_verified) score += 20;
    if (input.full_name) score += 5;
    
    score = Math.max(30, Math.min(100, score));
    
    const processingTime = Date.now() - startTime;
    
    // Log API call
    await query(
      `INSERT INTO api_calls 
       (id, user_id, api_key_id, endpoint, method, status_code, processing_time_ms, created_at)
       VALUES ($1, $2, $3, '/v1/calculate', 'POST', 200, $4, NOW())`,
      [uuidv4(), partnerId, 'api-key', processingTime]
    );
    
    res.json({
      request_id: requestId,
      score,
      risk_level: score >= 60 ? 'low' : score >= 45 ? 'medium' : 'high',
      processing_time_ms: processingTime,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
});

export default router;
