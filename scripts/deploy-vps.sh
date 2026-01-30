#!/bin/bash
# ============================================
# WOUAKA VPS DEPLOYMENT SCRIPT
# ============================================
# Deploy Wouaka to self-hosted VPS
# ============================================

set -e

echo "╔════════════════════════════════════════════╗"
echo "║      WOUAKA VPS DEPLOYMENT SCRIPT          ║"
echo "╚════════════════════════════════════════════╝"

# ============================================
# CONFIGURATION
# ============================================
DOMAIN="wouaka-creditscore.com"
DEPLOY_DIR="/opt/wouaka"

# ============================================
# PRE-FLIGHT CHECKS
# ============================================
echo ""
echo "📋 Pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker and Docker Compose are installed"

# ============================================
# CREATE DIRECTORIES
# ============================================
echo ""
echo "📁 Creating directories..."

sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $DEPLOY_DIR/ssl
sudo mkdir -p $DEPLOY_DIR/backups

# ============================================
# COPY FILES
# ============================================
echo ""
echo "📦 Copying deployment files..."

# Copy docker-compose and configs
sudo cp docker-compose.vps.yml $DEPLOY_DIR/docker-compose.yml
sudo cp nginx-vps.conf $DEPLOY_DIR/nginx-vps.conf
sudo cp -r backend $DEPLOY_DIR/backend
sudo cp -r sql $DEPLOY_DIR/sql
sudo cp -r scripts $DEPLOY_DIR/scripts
sudo cp Dockerfile $DEPLOY_DIR/Dockerfile

# Copy frontend build
if [ -d "dist" ]; then
    sudo cp -r dist $DEPLOY_DIR/dist
else
    echo "⚠️ Frontend dist not found. Building..."
    npm run build
    sudo cp -r dist $DEPLOY_DIR/dist
fi

# ============================================
# ENVIRONMENT FILE
# ============================================
echo ""
echo "🔐 Setting up environment..."

if [ ! -f "$DEPLOY_DIR/.env" ]; then
    sudo cp .env.vps.example $DEPLOY_DIR/.env
    echo "⚠️ Please edit $DEPLOY_DIR/.env with your production values!"
    echo "   Required secrets: POSTGRES_PASSWORD, JWT_SECRET, MINIO_SECRET_KEY"
    echo "   Payment keys: CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_SECRET_KEY"
fi

# ============================================
# SSL CERTIFICATES
# ============================================
echo ""
echo "🔒 Setting up SSL..."

if [ ! -f "$DEPLOY_DIR/ssl/fullchain.pem" ]; then
    echo "⚠️ SSL certificates not found!"
    echo "   Option 1: Use Coolify for automatic Let's Encrypt"
    echo "   Option 2: Run certbot manually:"
    echo "   sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d storage.$DOMAIN"
    echo ""
    echo "   After obtaining certificates, copy them to:"
    echo "   $DEPLOY_DIR/ssl/fullchain.pem"
    echo "   $DEPLOY_DIR/ssl/privkey.pem"
    
    # Create temporary self-signed for testing
    echo "   Creating temporary self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $DEPLOY_DIR/ssl/privkey.pem \
        -out $DEPLOY_DIR/ssl/fullchain.pem \
        -subj "/CN=$DOMAIN"
fi

# ============================================
# BUILD AND START
# ============================================
echo ""
echo "🚀 Building and starting services..."

cd $DEPLOY_DIR

# Pull latest images
sudo docker-compose pull

# Build custom images
sudo docker-compose build

# Start services
sudo docker-compose up -d

# ============================================
# WAIT FOR SERVICES
# ============================================
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo ""
echo "🏥 Health checks..."

# Postgres
if docker exec wouaka-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not ready"
fi

# API
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding"
fi

# MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is healthy"
else
    echo "❌ MinIO is not responding"
fi

# Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

# ============================================
# FINAL INSTRUCTIONS
# ============================================
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║        DEPLOYMENT COMPLETE! 🎉             ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📍 Service URLs:"
echo "   Frontend: https://www.$DOMAIN"
echo "   API:      https://api.$DOMAIN"
echo "   Storage:  https://storage.$DOMAIN"
echo "   MinIO UI: http://localhost:9001"
echo ""
echo "📋 Next steps:"
echo "   1. Edit $DEPLOY_DIR/.env with production secrets"
echo "   2. Configure real SSL certificates"
echo "   3. Run user migration script"
echo "   4. Configure DNS records:"
echo "      A record: $DOMAIN -> VPS_IP"
echo "      A record: www.$DOMAIN -> VPS_IP"
echo "      A record: api.$DOMAIN -> VPS_IP"
echo "      A record: storage.$DOMAIN -> VPS_IP"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Restart:   docker-compose restart"
echo "   Stop:      docker-compose down"
echo "   Update:    git pull && docker-compose up -d --build"
echo ""
