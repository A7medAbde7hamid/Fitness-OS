# Deployment Guide

## Overview

AI Fitness OS is a single-server application with:
- Express backend (server.ts)
- React frontend (Vite build)
- Supabase (database, auth, storage)

## Prerequisites

- Node.js 20+
- Supabase project (free tier or higher)
- Gemini API key
- (Optional) WhatsApp Business API credentials

## Development

```bash
git clone https://github.com/your-org/ai-fitness-os.git
cd ai-fitness-os
npm install
cp .env.example .env.development
# Edit .env.development
npm run dev
```

## Staging Deployment

### Option 1: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --token $VERCEL_TOKEN

# Deploy to production
vercel --prod --token $VERCEL_TOKEN
```

### Option 2: Docker

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Cloud Run (GCP)

```bash
# Build and deploy
gcloud run deploy ai-fitness-os \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 4: Custom Server

```bash
# Build
npm run build

# Run with PM2
pm2 start dist/server.cjs --name ai-fitness-os

# Or with systemd
# See docs/systemd-service.md
```

## Production Deployment

### Environment Variables

Set these in your deployment platform:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `VITE_SUPABASE_URL` | Yes | Supabase URL (client) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key (client) |
| `WHATSAPP_PROVIDER` | No | `cloud_api` or `mock` |
| `RATE_LIMIT_ENABLED` | Yes | `true` for production |

### Post-Deploy Verification

```bash
# Health check
curl -f https://your-domain.com/health

# Database health
curl -f https://your-domain.com/health/db

# AI health
curl -f https://your-domain.com/health/ai
```

## Database Migrations

```bash
# Apply migrations
supabase db push

# Or via Supabase Dashboard
# Go to SQL Editor and run migration files
```

## Rollback

### Frontend
Redeploy previous build artifact.

### Backend
Redeploy previous server version.

### Database
Only rollback if safe (no destructive changes). See recovery-runbook.md.
