# Remote Job Search Machine

A production-ready job aggregation platform for remote-first international roles.
Optimized for Korean-speaking professionals in music, web3, tech, and startup ecosystems.

## Stack

- **Next.js 14** (App Router, Server Components)
- **TypeScript** — strict mode
- **Tailwind CSS** — dark mode first, Linear/Raycast aesthetic
- **Supabase** — PostgreSQL + pgvector for semantic search
- **Prisma ORM** — type-safe DB access
- **TanStack Query** — server state, caching, pagination
- **Vercel** — deployment + built-in cron (every 6h)

## Job Sources

| Source | Coverage | Auth |
|--------|----------|------|
| JSearch (RapidAPI) | Global, large volume | RapidAPI key |
| Adzuna | EU, UK, AU, US | App ID + Key |
| Arbeitnow | Europe, remote-first | None (public) |

## Features

- Multi-source aggregation with deduplication
- Smart keyword tagging (Customer Success, Music, Web3, Community, etc.)
- Advanced filtering: region, seniority, visa, Korean-speaking, tags
- Bookmarks + "Applied" tracker (session-based, no login required)
- Job detail slide-in panel
- Cron sync every 6 hours via Vercel
- Auto-expire jobs after 45 days
- pgvector-ready schema for semantic search (OpenAI ada-002)

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Fill in your keys (see below)
```

### 3. Database setup

Create a [Supabase](https://supabase.com) project, then:

```bash
# Push Prisma schema to Supabase
npm run db:push

# Or run the raw SQL migration
# Paste supabase/migrations/001_initial.sql into Supabase SQL Editor
```

### 4. Run locally

```bash
npm run dev
```

### 5. Manual sync

```bash
npm run sync
```

## API Keys

### JSearch (RapidAPI)
1. Sign up at [rapidapi.com](https://rapidapi.com)
2. Subscribe to **JSearch** API
3. Copy your `X-RapidAPI-Key` → `RAPIDAPI_KEY`

### Adzuna
1. Register at [developer.adzuna.com](https://developer.adzuna.com)
2. Create an app → get `App ID` + `App Key`
3. Set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`

### Arbeitnow
No authentication needed. Public API, EU-focused remote jobs.

### OpenAI (optional)
Set `OPENAI_API_KEY` to enable semantic search indexing via `src/lib/embeddings.ts`.

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Set all env vars in Vercel dashboard, then:
- Cron runs automatically every 6 hours via `vercel.json`
- Set `CRON_SECRET` to a secure random string
- The cron hits `GET /api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── jobs/          # GET jobs with filters
│   │   ├── sync/          # POST to trigger sync
│   │   ├── bookmarks/     # GET/POST/DELETE bookmarks
│   │   ├── applications/  # GET/POST/DELETE applied jobs
│   │   └── cron/sync/     # Vercel cron handler
│   ├── page.tsx           # Main dashboard
│   ├── bookmarks/page.tsx # Saved jobs view
│   └── layout.tsx
├── components/
│   ├── SearchBar.tsx
│   ├── FilterSidebar.tsx
│   ├── JobCard.tsx
│   ├── JobList.tsx
│   ├── JobDetailPanel.tsx
│   ├── StatsBar.tsx
│   ├── SourceBadge.tsx
│   ├── TagBadge.tsx
│   └── providers/
├── hooks/
│   ├── useJobs.ts
│   ├── useBookmarks.ts
│   └── useApplications.ts
├── lib/
│   ├── fetchers/          # JSearch, Adzuna, Arbeitnow
│   ├── tagger.ts          # Keyword-based tag/classify engine
│   ├── deduplicator.ts    # URL-based dedup + expiry
│   ├── embeddings.ts      # OpenAI pgvector integration
│   ├── prisma.ts
│   ├── supabase.ts
│   └── utils.ts
└── types/
    └── job.ts             # All shared types
prisma/
└── schema.prisma
supabase/migrations/
└── 001_initial.sql
scripts/
└── sync.ts              # CLI sync runner
vercel.json                 # Cron schedule
```

## Semantic Search (pgvector)

The schema is embedding-ready. To activate:

1. Enable pgvector in Supabase (already in migration SQL)
2. Set `OPENAI_API_KEY`
3. After syncing jobs, call `indexJobEmbedding(jobId, text)` from `src/lib/embeddings.ts`
4. Use the `match_jobs()` SQL function for cosine similarity search

Query examples the system is tuned for:
- `"music industry jobs in Europe"`
- `"Korean speaking remote startup roles"`
- `"community web3 APAC"`
- `"artist success partnerships"`

## License

MIT
