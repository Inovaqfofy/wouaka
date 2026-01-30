// ============================================
// WOUAKA - MinIO Storage Configuration
// ============================================
// S3-compatible storage for KYC documents
// ============================================

import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Bucket names
export const BUCKETS = {
  KYC_DOCUMENTS: 'kyc-documents',
  AVATARS: 'avatars',
  INVOICES: 'invoices',
  DATASETS: 'datasets',
  TICKET_ATTACHMENTS: 'ticket-attachments',
  EMAIL_ASSETS: 'email-assets',
} as const;

// Initialize buckets on startup
export async function initializeBuckets() {
  for (const [name, bucket] of Object.entries(BUCKETS)) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        console.log(`[MinIO] Created bucket: ${bucket}`);
        
        // Set public policy for avatars and email-assets
        if (bucket === 'avatars' || bucket === 'email-assets') {
          const policy = {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            }],
          };
          await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
        }
      }
    } catch (error) {
      console.error(`[MinIO] Error initializing bucket ${bucket}:`, error);
    }
  }
}

// Upload file
export async function uploadFile(
  bucket: string,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  });
  
  // Generate URL
  const baseUrl = process.env.MINIO_PUBLIC_URL || `http://localhost:9000`;
  return `${baseUrl}/${bucket}/${objectName}`;
}

// Get presigned URL for private files
export async function getPresignedUrl(
  bucket: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  return await minioClient.presignedGetObject(bucket, objectName, expirySeconds);
}

// Delete file
export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  await minioClient.removeObject(bucket, objectName);
}

// List files
export async function listFiles(bucket: string, prefix?: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const files: string[] = [];
    const stream = minioClient.listObjects(bucket, prefix, true);
    
    stream.on('data', (obj) => {
      if (obj.name) files.push(obj.name);
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(files));
  });
}
