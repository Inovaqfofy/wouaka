// ============================================
// WOUAKA - Payments Routes
// ============================================
// CinetPay and payment processing
// ============================================

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { query, queryOne } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2';
const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const CINETPAY_SECRET_KEY = process.env.CINETPAY_SECRET_KEY;

// ============================================
// INITIALIZE PAYMENT
// ============================================
router.post('/initialize', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { plan_id, amount, currency, description } = req.body;
  
  if (!plan_id || !amount) {
    return res.status(400).json({ error: 'Plan and amount required' });
  }
  
  const transactionId = `WOK-${Date.now()}-${uuidv4().substring(0, 8)}`;
  
  // Get user info
  const user = await queryOne<{ email: string; full_name: string; phone: string }>(
    'SELECT email, full_name, phone FROM profiles WHERE id = $1',
    [userId]
  );
  
  // Create payment transaction record
  await query(
    `INSERT INTO payment_transactions 
     (id, user_id, transaction_id, amount, currency, status, payment_method, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', 'cinetpay', $6, NOW())`,
    [
      uuidv4(),
      userId,
      transactionId,
      amount,
      currency || 'XOF',
      JSON.stringify({ plan_id, description }),
    ]
  );
  
  // Initialize CinetPay payment
  try {
    const response = await axios.post(`${CINETPAY_API_URL}/payment`, {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount,
      currency: currency || 'XOF',
      description: description || `Abonnement WOUAKA - ${plan_id}`,
      customer_name: user?.full_name || 'Client WOUAKA',
      customer_email: user?.email,
      customer_phone_number: user?.phone,
      notify_url: `${process.env.API_URL}/api/webhooks/cinetpay`,
      return_url: `${process.env.FRONTEND_URL}/payment/confirmation`,
      channels: 'ALL',
      metadata: JSON.stringify({
        user_id: userId,
        plan_id,
      }),
    });
    
    if (response.data.code === '201') {
      res.json({
        success: true,
        transaction_id: transactionId,
        payment_url: response.data.data.payment_url,
        payment_token: response.data.data.payment_token,
      });
    } else {
      throw new Error(response.data.message || 'Payment initialization failed');
    }
  } catch (error: any) {
    console.error('[Payment] CinetPay error:', error.response?.data || error.message);
    
    // Update transaction as failed
    await query(
      `UPDATE payment_transactions SET status = 'failed', updated_at = NOW() WHERE transaction_id = $1`,
      [transactionId]
    );
    
    res.status(500).json({
      error: 'Payment Error',
      message: 'Failed to initialize payment',
    });
  }
});

// ============================================
// CHECK PAYMENT STATUS
// ============================================
router.get('/status/:transactionId', async (req: AuthenticatedRequest, res: Response) => {
  const { transactionId } = req.params;
  const userId = req.user!.id;
  
  const transaction = await queryOne(
    'SELECT * FROM payment_transactions WHERE transaction_id = $1 AND user_id = $2',
    [transactionId, userId]
  );
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  // If pending, check with CinetPay
  if (transaction.status === 'pending') {
    try {
      const response = await axios.post(`${CINETPAY_API_URL}/payment/check`, {
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
      });
      
      if (response.data.data?.status === 'ACCEPTED') {
        await query(
          `UPDATE payment_transactions SET status = 'completed', updated_at = NOW() WHERE transaction_id = $1`,
          [transactionId]
        );
        transaction.status = 'completed';
      } else if (response.data.data?.status === 'REFUSED') {
        await query(
          `UPDATE payment_transactions SET status = 'failed', updated_at = NOW() WHERE transaction_id = $1`,
          [transactionId]
        );
        transaction.status = 'failed';
      }
    } catch (error) {
      console.error('[Payment] Status check error:', error);
    }
  }
  
  res.json({
    transaction_id: transactionId,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    created_at: transaction.created_at,
  });
});

// ============================================
// LIST USER TRANSACTIONS
// ============================================
router.get('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
  const result = await query(
    `SELECT * FROM payment_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  
  res.json({ transactions: result.rows });
});

// ============================================
// GET SUBSCRIPTION PLANS
// ============================================
router.get('/plans', async (req: AuthenticatedRequest, res: Response) => {
  const result = await query(
    `SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC`
  );
  
  res.json({ plans: result.rows });
});

export default router;
