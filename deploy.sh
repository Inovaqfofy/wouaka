#!/bin/bash
# ============================================
# WOUAKA VPS DEPLOYMENT SCRIPT
# ============================================
# This script deploys WOUAKA to a VPS with Coolify
# Prerequisites:
#   - Docker & Docker Compose installed
#   - SSL certificates in ./ssl directory
#   - .env file configured
# ============================================

set -e

echo "================================================"
echo "  WOUAKA Production Deployment"
echo "  Domain: wouaka-creditscore.com"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}Error: .env file not found. Copy .env.example to .env and configure it.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Create required directories
setup_directories() {
    echo -e "${YELLOW}[2/7] Setting up directories...${NC}"
    
    mkdir -p ssl
    mkdir -p logs/nginx
    mkdir -p logs/app
    
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Pull Ollama model
setup_ollama() {
    echo -e "${YELLOW}[3/7] Setting up Ollama with DeepSeek model...${NC}"
    
    # Start Ollama container first
    docker-compose up -d ollama
    
    # Wait for Ollama to be ready
    echo "Waiting for Ollama to start..."
    sleep 10
    
    # Pull the DeepSeek model
    OLLAMA_MODEL=${OLLAMA_MODEL:-deepseek-r1:8b}
    echo "Pulling model: $OLLAMA_MODEL"
    docker exec wouaka-ollama ollama pull $OLLAMA_MODEL || {
        echo -e "${YELLOW}Warning: Could not pull $OLLAMA_MODEL, trying smaller model...${NC}"
        docker exec wouaka-ollama ollama pull deepseek-r1:1.5b
    }
    
    echo -e "${GREEN}✓ Ollama setup complete${NC}"
}

# Build and deploy
deploy() {
    echo -e "${YELLOW}[4/7] Building and deploying containers...${NC}"
    
    # Build frontend
    docker-compose build frontend
    
    # Start all services
    docker-compose up -d
    
    echo -e "${GREEN}✓ Deployment complete${NC}"
}

# Setup SSL certificates
setup_ssl() {
    echo -e "${YELLOW}[5/7] Checking SSL certificates...${NC}"
    
    if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
        echo -e "${YELLOW}SSL certificates not found. Generating self-signed certificates for testing...${NC}"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/privkey.pem \
            -out ssl/fullchain.pem \
            -subj "/C=CI/ST=Abidjan/L=Abidjan/O=Wouaka/CN=wouaka-creditscore.com"
        
        echo -e "${YELLOW}Note: Replace these with Let's Encrypt certificates for production${NC}"
    else
        echo -e "${GREEN}✓ SSL certificates found${NC}"
    fi
}

# Health check
health_check() {
    echo -e "${YELLOW}[6/7] Running health checks...${NC}"
    
    sleep 10  # Wait for services to fully start
    
    # Check frontend
    if curl -sf http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
    fi
    
    # Check Postgres
    if docker exec wouaka-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}✗ PostgreSQL health check failed${NC}"
    fi
    
    # Check Ollama
    if curl -sf http://localhost:11434 > /dev/null; then
        echo -e "${GREEN}✓ Ollama is running${NC}"
    else
        echo -e "${YELLOW}⚠ Ollama health check failed (may still be starting)${NC}"
    fi
    
    # Check Redis
    if docker exec wouaka-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis health check failed${NC}"
    fi
}

# Print status
print_status() {
    echo -e "${YELLOW}[7/7] Deployment Summary${NC}"
    echo "================================================"
    echo -e "${GREEN}WOUAKA is now deployed!${NC}"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "Access URLs:"
    echo "  - Frontend: https://www.wouaka-creditscore.com"
    echo "  - API: https://api.wouaka-creditscore.com"
    echo "  - Sandbox: https://sandbox.wouaka-creditscore.com"
    echo ""
    echo "Local development URLs:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Edge Functions: http://localhost:54321"
    echo "  - Ollama API: http://localhost:11434"
    echo "  - PostgreSQL: localhost:5432"
    echo ""
    echo "AI Provider: ${AI_PROVIDER:-ollama}"
    echo ""
    echo "Logs:"
    echo "  docker-compose logs -f frontend"
    echo "  docker-compose logs -f ollama"
    echo "================================================"
}

# Main execution
main() {
    check_prerequisites
    setup_directories
    setup_ssl
    setup_ollama
    deploy
    health_check
    print_status
}

# Run main function
main "$@"
