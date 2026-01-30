// ============================================
// WOUAKA - Admin Routes
// ============================================
// Admin-only endpoints
// ============================================

import { Router, Response } from 'express';
import { query, queryOne } from '../config/database.js';
import { AuthenticatedRequest, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require admin
router.use(adminMiddleware);

// ============================================
// GET DASHBOARD STATS
// ============================================
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  // Users count
  const usersResult = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM profiles WHERE is_active = true'
  );
  
  // Scoring requests today
  const scoringResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM scoring_requests 
     WHERE created_at >= CURRENT_DATE`
  );
  
  // Active subscriptions
  const subscriptionsResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM subscriptions 
     WHERE status = 'active' AND current_period_end > NOW()`
  );
  
  // Revenue this month
  const revenueResult = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions 
     WHERE status = 'completed' 
     AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`
  );
  
  // Pending KYC
  const kycResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM kyc_requests WHERE status = 'pending'`
  );
  
  // Security alerts
  const alertsResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM security_alerts 
     WHERE acknowledged = false AND severity IN ('high', 'critical')`
  );
  
  res.json({
    users: {
      total: usersResult?.count || 0,
    },
    scoring: {
      today: scoringResult?.count || 0,
    },
    subscriptions: {
      active: subscriptionsResult?.count || 0,
    },
    revenue: {
      this_month: revenueResult?.total || 0,
      currency: 'XOF',
    },
    kyc: {
      pending: kycResult?.count || 0,
    },
    security: {
      unacknowledged_alerts: alertsResult?.count || 0,
    },
  });
});

// ============================================
// LIST USERS
// ============================================
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const search = req.query.search as string;
  
  let whereClause = '';
  const params: any[] = [limit, offset];
  
  if (search) {
    whereClause = `WHERE p.email ILIKE $3 OR p.full_name ILIKE $3 OR p.phone ILIKE $3`;
    params.push(`%${search}%`);
  }
  
  const result = await query(
    `SELECT p.*, ur.role, 
            (SELECT COUNT(*) FROM scoring_requests sr WHERE sr.user_id = p.id) as scoring_count,
            (SELECT COUNT(*) FROM certificates c WHERE c.user_id = p.id) as certificate_count
     FROM profiles p
     LEFT JOIN user_roles ur ON ur.user_id = p.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  
  res.json({
    users: result.rows,
    pagination: { limit, offset },
  });
});

// ============================================
// UPDATE USER
// ============================================
router.patch('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_active, role } = req.body;
  
  if (is_active !== undefined) {
    await query(
      'UPDATE profiles SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [is_active, id]
    );
  }
  
  if (role) {
    await query(
      `UPDATE user_roles SET role = $1 WHERE user_id = $2`,
      [role, id]
    );
  }
  
  res.json({ success: true });
});

// ============================================
// SECURITY ALERTS
// ============================================
router.get('/security/alerts', async (req: AuthenticatedRequest, res: Response) => {
  const result = await query(
    `SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT 100`
  );
  
  res.json({ alerts: result.rows });
});

router.patch('/security/alerts/:id/acknowledge', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  await query(
    `UPDATE security_alerts 
     SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW()
     WHERE id = $2`,
    [req.user!.id, id]
  );
  
  res.json({ success: true });
});

// ============================================
// SYSTEM SETTINGS
// ============================================
router.get('/settings', async (req: AuthenticatedRequest, res: Response) => {
  const result = await query(
    `SELECT * FROM settings WHERE is_system = true`
  );
  
  res.json({ settings: result.rows });
});

router.patch('/settings/:key', async (req: AuthenticatedRequest, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  
  await query(
    `INSERT INTO settings (key, value, is_system, updated_at)
     VALUES ($1, $2, true, NOW())
     ON CONFLICT (user_id, key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
  
  res.json({ success: true });
});

// ============================================
// LOCKDOWN CONTROLS
// ============================================
router.get('/lockdown', async (req: AuthenticatedRequest, res: Response) => {
  const lockdown = await queryOne(
    'SELECT * FROM system_lockdown_state WHERE id = $1',
    ['00000000-0000-0000-0000-000000000001']
  );
  
  res.json(lockdown || { is_full_lockdown: false, is_read_only_mode: false });
});

router.post('/lockdown', async (req: AuthenticatedRequest, res: Response) => {
  const { is_full_lockdown, is_read_only_mode, lockdown_reason } = req.body;
  
  await query(
    `UPDATE system_lockdown_state 
     SET is_full_lockdown = $1, is_read_only_mode = $2, lockdown_reason = $3,
         locked_at = CASE WHEN $1 OR $2 THEN NOW() ELSE NULL END,
         locked_by = $4
     WHERE id = '00000000-0000-0000-0000-000000000001'`,
    [is_full_lockdown, is_read_only_mode, lockdown_reason, req.user!.id]
  );
  
  res.json({ success: true });
});

export default router;
