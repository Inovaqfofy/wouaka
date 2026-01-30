// ============================================
// WOUAKA BACKEND - Express API Server
// ============================================
// Self-hosted replacement for Supabase Edge Functions
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';

// Load environment variables
config();

// Import routes
import authRoutes from './routes/auth.js';
import scoringRoutes from './routes/scoring.js';
import kycRoutes from './routes/kyc.js';
import certificatesRoutes from './routes/certificates.js';
import paymentsRoutes from './routes/payments.js';
import webhooksRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import storageRoutes from './routes/storage.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Handled by nginx
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhooksRoutes);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

app.use('/api/scoring', authMiddleware, scoringRoutes);
app.use('/api/kyc', authMiddleware, kycRoutes);
app.use('/api/certificates', authMiddleware, certificatesRoutes);
app.use('/api/payments', authMiddleware, paymentsRoutes);
app.use('/api/storage', authMiddleware, storageRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║         WOUAKA BACKEND SERVER              ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}            ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║  📦 Version: 1.0.0                         ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
