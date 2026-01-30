// ============================================
// WOUAKA - Webhook Routes
// ============================================
// External service webhooks (CinetPay, etc.)
// ============================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query, queryOne, withTransaction } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================
// CINETPAY WEBHOOK
// ============================================
router.post('/cinetpay', async (req: Request, res: Response) => {
  console.log('[Webhook] CinetPay notification received');
  
  const { cpm_trans_id, cpm_trans_status, cpm_amount, cpm_currency, signature } = req.body;
  
  // Verify signature
  const secretKey = process.env.CINETPAY_SECRET_KEY;
  if (secretKey && signature) {
    const expectedSignature = crypto
      .createHash('sha256')
      .update(`${cpm_trans_id}${cpm_amount}${secretKey}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('[Webhook] Invalid CinetPay signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  
  // Find transaction
  const transaction = await queryOne<{
    id: string;
    user_id: string;
    metadata: any;
    status: string;
  }>(
    'SELECT * FROM payment_transactions WHERE transaction_id = $1',
    [cpm_trans_id]
  );
  
  if (!transaction) {
    console.error('[Webhook] Transaction not found:', cpm_trans_id);
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  // Already processed
  if (transaction.status === 'completed') {
    return res.json({ success: true, already_processed: true });
  }
  
  const newStatus = cpm_trans_status === 'ACCEPTED' ? 'completed' : 'failed';
  
  // Update transaction and provision subscription if successful
  if (newStatus === 'completed') {
    await withTransaction(async (client) => {
      // Update transaction
      await client.query(
        `UPDATE payment_transactions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [transaction.id]
      );
      
      const metadata = transaction.metadata || {};
      const planId = metadata.plan_id;
      
      if (planId) {
        // Get plan details
        const plan = await client.query(
          'SELECT * FROM subscription_plans WHERE slug = $1',
          [planId]
        );
        
        if (plan.rows[0]) {
          const planData = plan.rows[0];
          const validityDays = planData.validity_days || 30;
          const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
          
          // Create subscription
          await client.query(
            `INSERT INTO certificate_subscriptions 
             (id, user_id, plan_id, amount_paid, payment_transaction_id,
              valid_from, valid_until, validity_days, max_free_shares,
              recertifications_total, recertifications_used, shares_used,
              status, source, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, 0, 0, 'active', 'cinetpay', NOW(), NOW())`,
            [
              uuidv4(),
              transaction.user_id,
              planId,
              cpm_amount,
              transaction.id,
              validUntil,
              validityDays,
              planData.max_free_shares || 3,
              planData.recertifications || 1,
            ]
          );
        }
      }
    });
  } else {
    await query(
      `UPDATE payment_transactions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, transaction.id]
    );
  }
  
  res.json({ success: true, status: newStatus });
});

// ============================================
// SMILE ID WEBHOOK
// ============================================
router.post('/smile-id', async (req: Request, res: Response) => {
  console.log('[Webhook] Smile ID notification received');
  
  const { job_id, result_code, result_text, user_id } = req.body;
  
  // Verify signature (TODO: implement Smile ID signature verification)
  
  // Find KYC request
  const kycRequest = await queryOne(
    `SELECT * FROM kyc_requests WHERE smile_id_job_id = $1`,
    [job_id]
  );
  
  if (!kycRequest) {
    console.error('[Webhook] KYC request not found for job:', job_id);
    return res.status(404).json({ error: 'KYC request not found' });
  }
  
  // Update KYC status based on result
  const verified = result_code === '0000' || result_code === '0810';
  
  await query(
    `UPDATE kyc_requests 
     SET smile_id_result = $1,
         status = $2,
         verified_at = CASE WHEN $2 = 'verified' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE smile_id_job_id = $3`,
    [JSON.stringify(req.body), verified ? 'verified' : 'rejected', job_id]
  );
  
  res.json({ success: true });
});

// ============================================
// PARTNER WEBHOOK DELIVERY
// ============================================
router.post('/deliver/:webhookId', async (req: Request, res: Response) => {
  const { webhookId } = req.params;
  const { event, payload } = req.body;
  
  // Get webhook config
  const webhook = await queryOne<{
    id: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
  }>(
    'SELECT * FROM webhooks WHERE id = $1',
    [webhookId]
  );
  
  if (!webhook || !webhook.is_active) {
    return res.status(404).json({ error: 'Webhook not found or inactive' });
  }
  
  if (!webhook.events.includes(event)) {
    return res.json({ skipped: true, reason: 'Event not subscribed' });
  }
  
  // Sign payload
  const timestamp = Date.now();
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(signaturePayload)
    .digest('hex');
  
  // Deliver webhook
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WOUAKA-Signature': signature,
        'X-WOUAKA-Timestamp': timestamp.toString(),
        'X-WOUAKA-Event': event,
      },
      body: JSON.stringify(payload),
    });
    
    // Log delivery
    await query(
      `INSERT INTO webhook_deliveries 
       (id, webhook_id, event, payload, status_code, response, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        uuidv4(),
        webhookId,
        event,
        JSON.stringify(payload),
        response.status,
        await response.text(),
      ]
    );
    
    res.json({
      success: response.ok,
      status_code: response.status,
    });
  } catch (error: any) {
    // Log failed delivery
    await query(
      `INSERT INTO webhook_deliveries 
       (id, webhook_id, event, payload, status_code, error, delivered_at)
       VALUES ($1, $2, $3, $4, 0, $5, NOW())`,
      [uuidv4(), webhookId, event, JSON.stringify(payload), error.message]
    );
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
