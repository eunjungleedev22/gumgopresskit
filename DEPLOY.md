# Pitchdeck — Deployment Guide

## Local Development

```bash
cp .env.example .env.local
# Fill in your keys (see below)
npm install
npm run dev
```

---

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. In your project's **SQL Editor**, run `supabase/schema.sql`
3. Then run `supabase/seed.sql` to populate venue data
4. In **Authentication → Providers**, enable:
   - Email (enabled by default)
   - Google (add Client ID + Secret from Google Cloud Console)
5. In **Authentication → URL Configuration**, add:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

---

## 2. Environment Variables

```env
# Supabase (from Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (or compatible API — Claude, Mistral, etc.)
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1  # or your endpoint
OPENAI_MODEL=gpt-4o-mini

# Resend (email outreach)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=pitch@yourdomain.com

# Mapbox (tour planner map, optional)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

> The pitch generator works without an OpenAI key — it will return a structured template pitch instead of AI-generated copy.

---

## 3. Vercel Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all variables

# Production deploy
vercel --prod
```

Or push to GitHub and connect the repo in the Vercel dashboard.

---

## 4. Alternative API Providers

The pitch generator uses OpenAI-compatible format. You can point it at:

| Provider | Base URL |
|----------|----------|
| OpenAI | `https://api.openai.com/v1` |
| Anthropic (via proxy) | Your proxy URL |
| Mistral | `https://api.mistral.ai/v1` |
| Together.ai | `https://api.together.xyz/v1` |
| Local (Ollama) | `http://localhost:11434/v1` |

---

## 5. Database Schema Overview

```
profiles       → User artist profiles
venues         → Venue database (25 seeded entries)
campaigns      → CRM pipeline entries (per-user)
messages       → Generated pitches saved to CRM
tours          → Tour plans
tour_stops     → Individual cities/dates per tour
bookings       → Confirmed bookings
```

All tables have Row Level Security — users only see their own data. Venues are globally readable.

---

## 6. Post-Deploy Checklist

- [ ] Supabase schema applied
- [ ] Seed data loaded
- [ ] Auth providers configured
- [ ] All env vars added to Vercel
- [ ] Custom domain configured (optional)
- [ ] Test signup → onboarding → venue discovery flow
