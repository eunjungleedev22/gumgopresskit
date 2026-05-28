-- Remote Job Search Machine - Initial Schema
-- Run this in Supabase SQL Editor or via prisma migrate

-- Enable pgvector for semantic search (optional)
create extension if not exists vector;

-- Enum types
create type remote_type as enum ('REMOTE', 'HYBRID', 'ONSITE');
create type seniority as enum ('ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');
create type industry as enum ('TECH', 'MUSIC', 'WEB3', 'CRYPTO', 'GAMING', 'MEDIA', 'FINANCE', 'EDUCATION', 'HEALTHCARE', 'OTHER');
create type source as enum ('JSEARCH', 'ADZUNA', 'ARBEITNOW');
create type sync_status as enum ('RUNNING', 'SUCCESS', 'FAILED');

-- Jobs table
create table if not exists "Job" (
  id               text primary key default gen_random_uuid()::text,
  "externalId"     text,
  title            text not null,
  company          text not null,
  location         text not null,
  "remoteType"     remote_type not null default 'REMOTE',
  "salaryMin"      int,
  "salaryMax"      int,
  "salaryCurrency" text default 'USD',
  url              text not null unique,
  description      text,
  tags             text[] not null default '{}',
  seniority        seniority not null default 'MID',
  "visaSponsorship" boolean not null default false,
  "koreanSpeaking"  boolean not null default false,
  industry         industry not null default 'TECH',
  source           source not null,
  "postedAt"       timestamptz not null,
  "expiresAt"      timestamptz,
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now(),
  embedding        vector(1536) -- OpenAI ada-002 dimensions
);

-- Indexes
create index if not exists idx_job_source on "Job"(source);
create index if not exists idx_job_industry on "Job"(industry);
create index if not exists idx_job_posted_at on "Job"("postedAt" desc);
create index if not exists idx_job_remote_type on "Job"("remoteType");
create index if not exists idx_job_korean on "Job"("koreanSpeaking");
create index if not exists idx_job_visa on "Job"("visaSponsorship");
create index if not exists idx_job_tags on "Job" using gin(tags);

-- Bookmarks
create table if not exists "Bookmark" (
  id           text primary key default gen_random_uuid()::text,
  "jobId"      text not null references "Job"(id) on delete cascade,
  "sessionId"  text not null,
  "createdAt"  timestamptz not null default now(),
  unique("jobId", "sessionId")
);
create index if not exists idx_bookmark_session on "Bookmark"("sessionId");

-- Applications
create table if not exists "Application" (
  id           text primary key default gen_random_uuid()::text,
  "jobId"      text not null references "Job"(id) on delete cascade,
  "sessionId"  text not null,
  "appliedAt"  timestamptz not null default now(),
  unique("jobId", "sessionId")
);
create index if not exists idx_application_session on "Application"("sessionId");

-- Sync logs
create table if not exists "SyncLog" (
  id             text primary key default gen_random_uuid()::text,
  source         source not null,
  status         sync_status not null,
  "jobsAdded"    int not null default 0,
  "jobsSkipped"  int not null default 0,
  error          text,
  "startedAt"    timestamptz not null default now(),
  "finishedAt"   timestamptz
);

-- Auto-expire old jobs (45 days)
create or replace function expire_old_jobs() returns void language sql as $$
  update "Job"
  set "expiresAt" = now()
  where "postedAt" < now() - interval '45 days'
    and "expiresAt" is null;
$$;

-- pgvector cosine similarity search function
create or replace function match_jobs(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 20
)
returns table (
  id text,
  title text,
  company text,
  similarity float
)
language sql stable as $$
  select
    id,
    title,
    company,
    1 - (embedding <=> query_embedding) as similarity
  from "Job"
  where 1 - (embedding <=> query_embedding) > match_threshold
    and ("expiresAt" is null or "expiresAt" > now())
  order by embedding <=> query_embedding
  limit match_count;
$$;
