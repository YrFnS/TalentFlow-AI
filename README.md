# TalentFlow AI

**AI-Powered HR & ATS Platform** — Streamline hiring, find the best candidates, and make data-driven recruiting decisions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React, Tailwind CSS, shadcn/ui, Radix UI |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | NextAuth.js v4 (Google OAuth, LinkedIn OAuth, Email) |
| AI | OpenRouter (multi-model) |
| State | TanStack Query, React Hook Form |
| Payments | Stripe |
| Email | Resend / SMTP / Console (dev) |
| i18n | next-intl |

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon or local)
- npm / bun

## Setup

1. **Clone and install**
   ```bash
   cp .env.example .env
   npm install
   ```

2. **Configure environment** — Edit `.env`:
   - `DATABASE_URL` — Your Neon/PostgreSQL connection string
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
   - Optional: Stripe, Resend, Slack/Teams webhook keys

3. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed demo data** (optional)
   ```bash
   npx prisma db seed
   ```
   Or call `POST /api/seed` as an admin user.

5. **Run development server**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | NextAuth signing secret |
| `NEXTAUTH_URL` | ✅ | App base URL |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `LINKEDIN_CLIENT_ID` | No | LinkedIn OAuth |
| `LINKEDIN_CLIENT_SECRET` | No | LinkedIn OAuth |
| `ENCRYPTION_KEY` | No | 32-byte hex key for encryption |
| `EMAIL_PROVIDER` | No | `CONSOLE` (default), `RESEND`, `SMTP` |
| `RESEND_API_KEY` | No | Resend API key |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe public key |
| `NEXT_PUBLIC_APP_URL` | No | Public-facing app URL |
| `SLACK_WEBHOOK_URL` | No | Slack integration webhook |
| `TEAMS_WEBHOOK_URL` | No | Teams integration webhook |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run type-check` | Run TypeScript type check |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Push schema to database |
| `npx prisma db seed` | Seed demo data |
| `npx prisma migrate dev` | Run migrations |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin panel routes
│   ├── (candidate)/       # Candidate portal
│   ├── (company)/         # Company HR dashboard
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── shared/            # Shared composite components
│   ├── layout/            # Layout components
│   └── providers/         # Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, auth, services
└── integrations/          # External service integrations
```

## License

Proprietary.
