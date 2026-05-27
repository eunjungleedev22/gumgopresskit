-- Pitchdeck database schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  dj_name text,
  genres text[] default '{}',
  bpm_min int,
  bpm_max int,
  home_city text,
  touring_regions text[] default '{}',
  epk_url text,
  soundcloud_url text,
  resident_advisor_url text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, dj_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'dj_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VENUES
-- ============================================================
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text,
  venue_type text check (venue_type in ('club', 'radio', 'collective', 'festival', 'bar')),
  capacity int,
  genres text[] default '{}',
  website text,
  instagram text,
  booking_email text,
  contact_name text,
  recent_lineups text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

alter table venues enable row level security;

-- Venues are publicly readable
create policy "Anyone can read venues"
  on venues for select using (true);

-- Only service role can insert/update venues
create policy "Service role can manage venues"
  on venues for all using (auth.role() = 'service_role');

-- ============================================================
-- CAMPAIGNS (CRM pipeline)
-- ============================================================
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  venue_id uuid references venues(id) on delete set null,
  stage text not null default 'wishlist'
    check (stage in ('wishlist', 'to_contact', 'sent', 'opened', 'interested', 'booked', 'rejected')),
  contact_name text,
  contact_email text,
  last_outreach_at timestamptz,
  next_followup_at timestamptz,
  notes text,
  probability int default 0 check (probability >= 0 and probability <= 100),
  fit_score int check (fit_score >= 0 and fit_score <= 100),
  fit_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index campaigns_user_id_idx on campaigns(user_id);
create index campaigns_stage_idx on campaigns(stage);

alter table campaigns enable row level security;

create policy "Users can manage own campaigns"
  on campaigns for all using (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  message_type text check (message_type in ('email', 'dm', 'intro')),
  content text not null,
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);

create index messages_campaign_id_idx on messages(campaign_id);
create index messages_user_id_idx on messages(user_id);

alter table messages enable row level security;

create policy "Users can manage own messages"
  on messages for all using (auth.uid() = user_id);

-- ============================================================
-- TOURS
-- ============================================================
create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status text default 'planning'
    check (status in ('planning', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create index tours_user_id_idx on tours(user_id);

alter table tours enable row level security;

create policy "Users can manage own tours"
  on tours for all using (auth.uid() = user_id);

-- ============================================================
-- TOUR STOPS
-- ============================================================
create table if not exists tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  city text not null,
  country text,
  date date,
  venue_id uuid references venues(id) on delete set null,
  status text default 'planning'
    check (status in ('planning', 'confirmed', 'cancelled')),
  notes text,
  order_index int default 0,
  created_at timestamptz default now()
);

create index tour_stops_tour_id_idx on tour_stops(tour_id);

alter table tour_stops enable row level security;

create policy "Users can manage stops of own tours"
  on tour_stops for all
  using (
    exists (
      select 1 from tours
      where tours.id = tour_stops.tour_id
        and tours.user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  venue_id uuid references venues(id) on delete set null,
  date date,
  set_time text,
  fee numeric,
  currency text default 'EUR',
  notes text,
  confirmed boolean default false,
  created_at timestamptz default now()
);

alter table bookings enable row level security;

create policy "Users can manage own bookings"
  on bookings for all using (auth.uid() = user_id);
