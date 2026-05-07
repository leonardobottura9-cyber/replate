-- ============================================================
-- Recipe Vault — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- Mirrors auth.users with extra app-level fields
-- ============================================================
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  name          text,
  subscription_tier text not null default 'free'
                  check (subscription_tier in ('free', 'pro', 'premium')),
  created_at    timestamptz not null default now()
);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RECIPES
-- ============================================================
create table if not exists public.recipes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text not null,
  source_url    text,
  image_url     text,
  ingredients   jsonb not null default '[]',
  instructions  text not null default '',
  description   text,
  created_at    timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_created_at_idx on public.recipes(created_at desc);

-- ============================================================
-- SWAPS
-- ============================================================
create table if not exists public.swaps (
  id                  uuid primary key default uuid_generate_v4(),
  recipe_id           uuid not null references public.recipes(id) on delete cascade,
  original_ingredient text not null,
  swapped_ingredient  text not null,
  original_macros     jsonb,
  swapped_macros      jsonb,
  created_at          timestamptz not null default now()
);

-- Macro JSON shape example:
-- { "calories": 120, "protein": 5, "carbs": 20, "fat": 3, "fiber": 2 }

create index if not exists swaps_recipe_id_idx on public.swaps(recipe_id);

-- ============================================================
-- SAVED VIDEOS
-- ============================================================
create table if not exists public.saved_videos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  video_url   text not null,
  platform    text not null default 'other'
                check (platform in ('youtube', 'tiktok', 'instagram', 'other')),
  title       text,
  thumbnail   text,
  created_at  timestamptz not null default now()
);

create index if not exists saved_videos_user_id_idx on public.saved_videos(user_id);
create index if not exists saved_videos_created_at_idx on public.saved_videos(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can only read/write their own data
-- ============================================================

alter table public.users        enable row level security;
alter table public.recipes      enable row level security;
alter table public.swaps        enable row level security;
alter table public.saved_videos enable row level security;

-- Users: read/update own profile
create policy "users: own row" on public.users
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Recipes: full CRUD on own recipes
create policy "recipes: own rows" on public.recipes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Swaps: access via recipe ownership
create policy "swaps: via recipe ownership" on public.swaps
  using (
    exists (
      select 1 from public.recipes r
      where r.id = swaps.recipe_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = swaps.recipe_id
        and r.user_id = auth.uid()
    )
  );

-- Saved videos: full CRUD on own videos
create policy "saved_videos: own rows" on public.saved_videos
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
