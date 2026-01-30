// ============================================
// WOUAKA - KYC Routes
// ============================================
// Identity verification endpoints
// ============================================

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadFile, BUCKETS, getPresignedUrl } from '../config/minio.js';

const router = Router();

// ============================================
// CREATE KYC REQUEST
// ============================================
router.post('/requests', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { verification_level, document_type } = req.body;
  
  const requestId = uuidv4();
  
  await query(
    `INSERT INTO kyc_requests 
     (id, user_id, verification_level, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'pending', NOW(), NOW())`,
    [requestId, userId, verification_level || 'basic']
  );
  
  res.status(201).json({
    success: true,
    request_id: requestId,
    status: 'pending',
    next_step: 'upload_document',
  });
});

// ============================================
// UPLOAD KYC DOCUMENT
// ============================================
router.post('/documents/:requestId', async (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.params;
  const userId = req.user!.id;
  
  // Verify request belongs to user
  const request = await queryOne(
    'SELECT * FROM kyc_requests WHERE id = $1 AND user_id = $2',
    [requestId, userId]
  );
  
  if (!request) {
    return res.status(404).json({ error: 'KYC request not found' });
  }
  
  const { document_type, file_base64, file_name, mime_type } = req.body;
  
  if (!file_base64) {
    return res.status(400).json({ error: 'File data required' });
  }
  
  // Convert base64 to buffer
  const buffer = Buffer.from(file_base64, 'base64');
  
  // Generate secure file path
  const documentId = uuidv4();
  const ext = file_name?.split('.').pop() || 'jpg';
  const objectName = `${userId}/${requestId}/${documentId}.${ext}`;
  
  // Upload to MinIO
  const fileUrl = await uploadFile(
    BUCKETS.KYC_DOCUMENTS,
    objectName,
    buffer,
    mime_type || 'image/jpeg'
  );
  
  // Store document reference
  await query(
    `INSERT INTO kyc_documents 
     (id, kyc_request_id, user_id, document_type, file_path, original_filename, mime_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [documentId, requestId, userId, document_type, objectName, file_name, mime_type]
  );
  
  // Update request status
  await query(
    `UPDATE kyc_requests SET status = 'document_uploaded', updated_at = NOW() WHERE id = $1`,
    [requestId]
  );
  
  res.json({
    success: true,
    document_id: documentId,
    status: 'uploaded',
    next_step: 'processing',
  });
});

// ============================================
// GET KYC STATUS
// ============================================
router.get('/requests/:requestId', async (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.params;
  const userId = req.user!.id;
  
  const request = await queryOne(
    `SELECT kr.*, 
            json_agg(kd.*) FILTER (WHERE kd.id IS NOT NULL) as documents
     FROM kyc_requests kr
     LEFT JOIN kyc_documents kd ON kd.kyc_request_id = kr.id
     WHERE kr.id = $1 AND kr.user_id = $2
     GROUP BY kr.id`,
    [requestId, userId]
  );
  
  if (!request) {
    return res.status(404).json({ error: 'KYC request not found' });
  }
  
  res.json(request);
});

// ============================================
// LIST USER'S KYC REQUESTS
// ============================================
router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const result = await query(
    `SELECT * FROM kyc_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  
  res.json({ requests: result.rows });
});

// ============================================
// PHONE VERIFICATION - SEND OTP
// ============================================
router.post('/phone/send-otp', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { phone_number } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number required' });
  }
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store OTP
  await query(
    `INSERT INTO otp_verifications 
     (id, user_id, phone_number, otp_code, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id, phone_number) 
     DO UPDATE SET otp_code = $4, expires_at = $5, attempts = 0`,
    [uuidv4(), userId, phone_number, otp, expiresAt]
  );
  
  // TODO: Send SMS via provider (AfricasTalking, etc.)
  console.log(`[OTP] Sending ${otp} to ${phone_number}`);
  
  res.json({
    success: true,
    message: 'OTP envoyé',
    expires_in: 600,
  });
});

// ============================================
// PHONE VERIFICATION - VERIFY OTP
// ============================================
router.post('/phone/verify-otp', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { phone_number, otp_code } = req.body;
  
  if (!phone_number || !otp_code) {
    return res.status(400).json({ error: 'Phone number and OTP required' });
  }
  
  const verification = await queryOne<{
    id: string;
    otp_code: string;
    expires_at: Date;
    attempts: number;
  }>(
    `SELECT * FROM otp_verifications 
     WHERE user_id = $1 AND phone_number = $2 AND expires_at > NOW()`,
    [userId, phone_number]
  );
  
  if (!verification) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }
  
  if (verification.attempts >= 3) {
    return res.status(429).json({ error: 'Too many attempts' });
  }
  
  if (verification.otp_code !== otp_code) {
    await query(
      `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`,
      [verification.id]
    );
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  // Mark as verified
  await query(
    `INSERT INTO phone_verifications 
     (id, user_id, phone_number, verified_at, verification_method)
     VALUES ($1, $2, $3, NOW(), 'sms_otp')
     ON CONFLICT (user_id, phone_number) DO UPDATE SET verified_at = NOW()`,
    [uuidv4(), userId, phone_number]
  );
  
  // Delete OTP
  await query('DELETE FROM otp_verifications WHERE id = $1', [verification.id]);
  
  res.json({
    success: true,
    verified: true,
    phone_number,
  });
});

export default router;
