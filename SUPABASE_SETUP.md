# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users (EU recommended for GDPR)
3. Note your **Project URL** and **API keys**

## 2. Get Your Connection Strings

In your Supabase dashboard: **Settings → Database**

- **Direct connection** (for Prisma migrations): `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`
- **Pooler connection** (for production/serverless): Use the pooler URL from the same page

Set in `.env`:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

## 3. Run Migrations

### Option A: Prisma (recommended)
```bash
npx prisma db push
```

### Option B: Raw SQL
Copy the contents of `supabase/migrations/001_initial.sql` and paste into:
**Supabase Dashboard → SQL Editor → New Query**

## 4. Enable pgvector

In SQL Editor:
```sql
create extension if not exists vector;
```
(Already included in the migration SQL)

## 5. Supabase API Keys

From **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (keep secret!)

## 6. Row Level Security (optional)

For production, enable RLS on `Bookmark` and `Application` tables.
Current implementation uses session cookies for user isolation — RLS adds a server-side safety net.

```sql
alter table "Bookmark" enable row level security;
alter table "Application" enable row level security;
```

## 7. Verify

```bash
npx prisma studio
```

You should see all tables: `Job`, `Bookmark`, `Application`, `SyncLog`.
