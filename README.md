# AI Fitness OS

A production-grade bilingual (EN/AR) AI-powered fitness and nutrition operating system with an intelligent AI Coach, WhatsApp integration, and offline-first PWA architecture.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS 4
- **Backend**: Express, Node.js
- **Database**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: Google Gemini 3.7 Flash
- **WhatsApp**: Meta Cloud API
- **Testing**: Vitest (unit), Playwright (E2E)
- **PWA**: Service Worker, IndexedDB, offline sync

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.development
# Edit .env.development with your values

# Start development server
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (frontend + server) |
| `npm start` | Run production server |
| `npm run lint` | TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Lint + test + build |
| `npm run security:scan` | Scan for hardcoded secrets |

## Project Structure

```
ai-fitness-os/
├── src/                    # Frontend React application
│   ├── components/         # UI components (40 files)
│   ├── context/            # React contexts (Auth, I18n, Connection, Navigation)
│   ├── db/                 # Database layer (IndexedDB, Supabase, Storage)
│   ├── services/           # Business logic (24 services)
│   ├── i18n/               # Internationalization (EN/AR)
│   └── types/              # TypeScript types
├── server/                 # Express server
│   ├── middleware/          # Auth, rate limiting, security, validation
│   ├── services/           # Server-side services (sync)
│   ├── whatsapp/           # WhatsApp integration (provider, router, webhook)
│   └── __tests__/          # Server tests
├── supabase/               # Database migrations
├── e2e/                    # Playwright end-to-end tests
├── docs/                   # Documentation
└── .github/                # CI/CD workflows
```

## Environments

| Environment | Purpose | Deploy |
|-------------|---------|--------|
| Development | Local development | `npm run dev` |
| Staging | Pre-production testing | CI/CD on `develop` branch |
| Production | Live application | CI/CD on `main` branch |

See `.env.development.example`, `.env.staging.example`, `.env.production.example` for configuration.

## Documentation

- [WhatsApp Integration](docs/whatsapp.md)
- [Production Checklist](docs/production-checklist.md)
- [Deployment Guide](docs/deployment.md)
- [Security Runbook](docs/security-runbook.md)
- [Recovery Runbook](docs/recovery-runbook.md)
- [Privacy Policy](docs/privacy.md)

## License

Private - All rights reserved.
