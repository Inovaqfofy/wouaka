# ============================================
# WOUAKA BACKEND DOCKERFILE
# ============================================
# Node.js/Express API Server
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Security: non-root user
RUN addgroup -g 1001 -S wouaka && \
    adduser -u 1001 -S wouaka -G wouaka && \
    chown -R wouaka:wouaka /app

USER wouaka

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
