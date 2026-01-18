<<<<<<< HEAD
# ============================================
# WOUAKA PRODUCTION DOCKERFILE
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source files
COPY . .

# Build arguments for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy static assets that might not be in dist
COPY public/favicon.ico /usr/share/nginx/html/favicon.ico
COPY public/favicon.png /usr/share/nginx/html/favicon.png
COPY public/og-banner.png /usr/share/nginx/html/og-banner.png
COPY public/manifest.json /usr/share/nginx/html/manifest.json
COPY public/robots.txt /usr/share/nginx/html/robots.txt
COPY public/sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY public/pwa-192x192.png /usr/share/nginx/html/pwa-192x192.png
COPY public/pwa-512x512.png /usr/share/nginx/html/pwa-512x512.png

# Security: Create non-root user
RUN addgroup -g 1001 -S wouaka && \
    adduser -u 1001 -S wouaka -G wouaka && \
    chown -R wouaka:wouaka /usr/share/nginx/html && \
    chown -R wouaka:wouaka /var/cache/nginx && \
    chown -R wouaka:wouaka /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R wouaka:wouaka /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
=======
# Étape 1 : Build
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copie d'une config Nginx pour gérer le routage React (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
>>>>>>> 7b7fe70ebbd570e71746bedf73ca37c40a0b6a41
CMD ["nginx", "-g", "daemon off;"]
