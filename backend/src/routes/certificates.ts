// ============================================
// WOUAKA - Certificates Routes
// ============================================
// Certificate management endpoints
// ============================================

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ============================================
// GET USER'S ACTIVE CERTIFICATE
// ============================================
router.get('/active', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const certificate = await queryOne(
    `SELECT c.*, 
            cs.plan_id as subscription_plan,
            cs.valid_until as subscription_valid_until,
            cs.shares_used,
            cs.max_free_shares,
            cs.recertifications_used,
            cs.recertifications_total
     FROM certificates c
     LEFT JOIN certificate_subscriptions cs ON cs.current_certificate_id = c.id
     WHERE c.user_id = $1 AND c.valid_until > NOW()
     ORDER BY c.valid_until DESC
     LIMIT 1`,
    [userId]
  );
  
  if (!certificate) {
    return res.json({ active: false, certificate: null });
  }
  
  // Calculate days remaining
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(certificate.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  
  res.json({
    active: true,
    certificate: {
      ...certificate,
      days_remaining: daysRemaining,
      is_expired: daysRemaining === 0,
    },
  });
});

// ============================================
// CREATE CERTIFICATE (after payment)
// ============================================
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { plan_id, score, certainty_coefficient, trust_level, proofs_snapshot } = req.body;
  
  const certificateId = uuidv4();
  const shareCode = generateShareCode();
  
  // Calculate validity based on plan
  let validityDays = 30;
  if (plan_id === 'emprunteur-essentiel') validityDays = 90;
  if (plan_id === 'emprunteur-premium') validityDays = 365;
  
  const validFrom = new Date();
  const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  
  await query(
    `INSERT INTO certificates 
     (id, user_id, plan_id, score, certainty_coefficient, trust_level, 
      proofs_snapshot, share_code, valid_from, valid_until, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [
      certificateId,
      userId,
      plan_id,
      score || 0,
      certainty_coefficient || 0,
      trust_level || 'basic',
      JSON.stringify(proofs_snapshot || {}),
      shareCode,
      validFrom,
      validUntil,
    ]
  );
  
  res.status(201).json({
    success: true,
    certificate_id: certificateId,
    share_code: shareCode,
    valid_from: validFrom,
    valid_until: validUntil,
    validity_days: validityDays,
  });
});

// ============================================
// VALIDATE CERTIFICATE (public endpoint)
// ============================================
router.get('/validate/:shareCode', async (req: AuthenticatedRequest, res: Response) => {
  const { shareCode } = req.params;
  
  const certificate = await queryOne(
    `SELECT c.*, p.full_name, p.phone
     FROM certificates c
     JOIN profiles p ON p.id = c.user_id
     WHERE c.share_code = $1`,
    [shareCode.toUpperCase()]
  );
  
  if (!certificate) {
    return res.status(404).json({
      valid: false,
      error: 'Certificate not found',
    });
  }
  
  const isExpired = new Date(certificate.valid_until) < new Date();
  
  res.json({
    valid: !isExpired,
    certificate: {
      share_code: certificate.share_code,
      holder_name: certificate.full_name,
      score: certificate.score,
      trust_level: certificate.trust_level,
      certainty_coefficient: certificate.certainty_coefficient,
      valid_from: certificate.valid_from,
      valid_until: certificate.valid_until,
      is_expired: isExpired,
    },
  });
});

// ============================================
// SHARE CERTIFICATE
// ============================================
router.post('/:id/share', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { shared_with_email, shared_with_partner_id } = req.body;
  
  // Verify ownership
  const certificate = await queryOne(
    'SELECT * FROM certificates WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  
  const shareId = uuidv4();
  const shareToken = uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await query(
    `INSERT INTO certificate_shares 
     (id, certificate_id, user_id, share_token, shared_with_email, shared_with_partner_id, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [shareId, id, userId, shareToken, shared_with_email, shared_with_partner_id, expiresAt]
  );
  
  res.json({
    success: true,
    share_id: shareId,
    share_token: shareToken,
    share_url: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
    expires_at: expiresAt,
  });
});

// ============================================
// RECERTIFY
// ============================================
router.post('/:id/recertify', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  // Check subscription allows recertification
  const subscription = await queryOne<{
    id: string;
    recertifications_used: number;
    recertifications_total: number | null;
  }>(
    `SELECT * FROM certificate_subscriptions 
     WHERE user_id = $1 AND status = 'active' AND valid_until > NOW()`,
    [userId]
  );
  
  if (!subscription) {
    return res.status(403).json({ error: 'No active subscription' });
  }
  
  if (
    subscription.recertifications_total !== null &&
    subscription.recertifications_used >= subscription.recertifications_total
  ) {
    return res.status(403).json({ error: 'No recertifications remaining' });
  }
  
  // Create new certificate as recertification
  const newCertificateId = uuidv4();
  const shareCode = generateShareCode();
  
  await query(
    `INSERT INTO certificates 
     (id, user_id, plan_id, score, certainty_coefficient, trust_level, 
      share_code, recertification_of, recertification_number, 
      valid_from, valid_until, created_at, updated_at)
     SELECT 
       $1, user_id, plan_id, score, certainty_coefficient, trust_level,
       $2, id, COALESCE(recertification_number, 0) + 1,
       NOW(), valid_until, NOW(), NOW()
     FROM certificates WHERE id = $3 AND user_id = $4`,
    [newCertificateId, shareCode, id, userId]
  );
  
  // Update subscription
  await query(
    `UPDATE certificate_subscriptions 
     SET recertifications_used = recertifications_used + 1,
         current_certificate_id = $1
     WHERE id = $2`,
    [newCertificateId, subscription.id]
  );
  
  res.json({
    success: true,
    new_certificate_id: newCertificateId,
    share_code: shareCode,
  });
});

// Helper function
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
