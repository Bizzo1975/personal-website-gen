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
# Reduced for low-memory VMs (3-4GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Install dependencies based on the preferred package manager
# Use npm install instead of npm ci for deps stage to reduce memory usage
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm install --only=production --prefer-offline --no-audit; \
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
# Production builds need more memory - use 4096MB for production builds
# This stage is only built for production (runner target), not development
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) needed for build
# Suppress npm warnings to reduce noise
RUN npm ci --no-audit --loglevel=error

# Copy source code (includes tsconfig.json and next.config.js)
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application - only if building for production
# Skip build for development to avoid SIGSEGV and unnecessary work
RUN if [ "$SKIP_BUILD" != "true" ] && [ "$BUILD_TARGET" = "production" ]; then \
        npm run build; \
    else \
        echo "Skipping build for development target"; \
        mkdir -p .next/static .next/standalone public; \
    fi

# Development image, copy all the files and run next dev
FROM base AS development
WORKDIR /app

ENV NODE_ENV development
ENV FRONTEND_PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies
RUN apk add --no-cache libc6-compat

# Increase Node.js memory limit for development (set before npm commands)
# Use more memory for npm ci to prevent SIGSEGV
ENV NODE_OPTIONS="--max-old-space-size=2048"

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

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"] 
