# Multi-stage Dockerfile for Personal Website
# Optimized for Linux/Ubuntu development and production deployment

# Base image with Node.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Increase Node.js memory limit to prevent SIGSEGV during npm install
# Set to 2048MB to handle @sendgrid/mail and other packages
# SIGILL (exit 132) is not a memory issue - it's corrupted cache/native bindings
# Cache-bust: v3 - Fixed memory limit, clear cache, skip optional deps
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install dependencies based on the preferred package manager
# Clear npm cache first to avoid corrupted cache issues
# Use npm ci for more reliable installs (requires package-lock.json)
# Skip postinstall script to prevent memory issues during Docker build
# Skip optional dependencies to avoid native binding issues
# Cache-bust: v4 - Added verbose logging and better error handling
COPY package.json package-lock.json* ./
RUN \
  npm cache clean --force && \
  if [ -f package-lock.json ]; then \
    echo "Installing production dependencies..." && \
    SKIP_POSTINSTALL=true npm ci --only=production --no-audit --ignore-scripts --loglevel=verbose || \
    (echo "npm ci failed, checking npm log..." && \
     cat /root/.npm/_logs/*-debug-*.log 2>/dev/null | tail -50 || true && \
     echo "Trying with npm install as fallback..." && \
     SKIP_POSTINSTALL=true npm install --only=production --no-audit --ignore-scripts --loglevel=verbose); \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Build argument to control whether to actually build (for production only)
ARG BUILD_TARGET=production
ARG SKIP_BUILD=false

# Install dependencies needed for building (including dev dependencies)
RUN apk add --no-cache libc6-compat

# Increase Node.js memory limit to prevent SIGSEGV during build
# Set to 2048MB to work on servers with limited RAM (4GB total)
# If build still fails:
#   - Check available RAM: free -h
#   - Add swap space: ./scripts/check-memory-and-swap.sh
#   - Ensure at least 2GB free RAM before building
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) needed for build
# Suppress npm warnings to reduce noise
# Skip postinstall scripts to prevent memory issues
# Cache-bust: v2 - Added --ignore-scripts to prevent postinstall from running
RUN SKIP_POSTINSTALL=true npm ci --no-audit --loglevel=error --ignore-scripts

# Copy source code (includes tsconfig.json and next.config.js)
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application for production
# Always build when targeting runner stage (production)
# The builder stage is only used for production builds
# Explicitly set memory limit during build to ensure it's applied
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Development image, copy all the files and run next dev
FROM base AS development
WORKDIR /app

ENV NODE_ENV development
ENV FRONTEND_PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies
RUN apk add --no-cache libc6-compat

# Increase Node.js memory limit for builder stage (set before npm commands)
# Use more memory for npm ci and build to prevent SIGSEGV
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies) for development
# Use npm install instead of npm ci for development to reduce memory pressure
# Suppress npm warnings to reduce noise
RUN npm install --no-audit --loglevel=error

# Copy source code (tsconfig.json and next.config.js are already included in COPY . .)
COPY . .

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Run as root in development to avoid permission issues with volumes
# USER nextjs

EXPOSE 3006

ENV PORT 3000

CMD ["npm", "run", "dev:docker"]

# Production image, copy all the files and run next start
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV FRONTEND_PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

# Install curl for healthcheck
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Use entrypoint script to ensure HOSTNAME is set before server starts
ENTRYPOINT ["./docker-entrypoint.sh"] 
