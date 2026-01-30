// ============================================
// WOUAKA - Storage Routes
// ============================================
// MinIO file storage endpoints
// ============================================

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadFile, getPresignedUrl, deleteFile, listFiles, BUCKETS } from '../config/minio.js';

const router = Router();

// ============================================
// UPLOAD FILE
// ============================================
router.post('/upload', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { bucket, file_base64, file_name, mime_type } = req.body;
  
  if (!file_base64 || !file_name) {
    return res.status(400).json({ error: 'File data and name required' });
  }
  
  // Validate bucket
  const allowedBuckets = Object.values(BUCKETS);
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' });
  }
  
  // Convert base64 to buffer
  const buffer = Buffer.from(file_base64, 'base64');
  
  // Limit file size (10MB)
  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large (max 10MB)' });
  }
  
  // Generate secure path
  const ext = file_name.split('.').pop() || 'bin';
  const objectName = `${userId}/${uuidv4()}.${ext}`;
  
  try {
    const url = await uploadFile(bucket, objectName, buffer, mime_type || 'application/octet-stream');
    
    res.json({
      success: true,
      path: objectName,
      url,
      bucket,
    });
  } catch (error: any) {
    console.error('[Storage] Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ============================================
// GET PRESIGNED URL (for private files)
// ============================================
router.get('/presigned', async (req: AuthenticatedRequest, res: Response) => {
  const { bucket, path } = req.query as { bucket: string; path: string };
  
  if (!bucket || !path) {
    return res.status(400).json({ error: 'Bucket and path required' });
  }
  
  // Verify user owns the file (path starts with userId)
  const userId = req.user!.id;
  if (!path.startsWith(`${userId}/`) && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const url = await getPresignedUrl(bucket, path, 3600); // 1 hour
    res.json({ url });
  } catch (error: any) {
    console.error('[Storage] Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// ============================================
// LIST USER FILES
// ============================================
router.get('/list', async (req: AuthenticatedRequest, res: Response) => {
  const { bucket } = req.query as { bucket: string };
  const userId = req.user!.id;
  
  if (!bucket) {
    return res.status(400).json({ error: 'Bucket required' });
  }
  
  try {
    const files = await listFiles(bucket, `${userId}/`);
    res.json({ files });
  } catch (error: any) {
    console.error('[Storage] List error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// ============================================
// DELETE FILE
// ============================================
router.delete('/', async (req: AuthenticatedRequest, res: Response) => {
  const { bucket, path } = req.body;
  const userId = req.user!.id;
  
  if (!bucket || !path) {
    return res.status(400).json({ error: 'Bucket and path required' });
  }
  
  // Verify ownership
  if (!path.startsWith(`${userId}/`) && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    await deleteFile(bucket, path);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Storage] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
