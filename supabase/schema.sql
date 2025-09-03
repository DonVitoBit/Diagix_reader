-- Supabase SQL schema and RLS policies for the reader app

-- Extensions
create extension if not exists "pgcrypto";

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  language text not null default 'ru',
  tags text[],
  format text not null check (format in ('epub','pdf')),
  cover_url text,
  file_path text not null,
  size_bytes bigint,
  checksum text,
  edition text,
  year int,
  isbn text,
  created_at timestamptz not null default now(),
  ts tsvector
);

create index if not exists books_ts_idx on public.books using GIN (ts);

create or replace function public.books_tsv_trigger() returns trigger as $$
begin
  new.ts := to_tsvector('simple',
    coalesce(new.title,'') || ' ' ||
    coalesce(new.author,'') || ' ' ||
    coalesce(new.description,'')
  );
  return new;
end
$$ language plpgsql;

drop trigger if exists tsvectorupdate on public.books;
create trigger tsvectorupdate before insert or update on public.books
for each row execute function public.books_tsv_trigger();

create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  loc text,
  percent numeric,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  cfi text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  cfi_range text not null,
  color text not null default 'yellow',
  note text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;

-- Policies: profiles (owner-only)
create policy "Profiles are viewable by owner" on public.profiles
  for select using (id = auth.uid());

create policy "Profiles are updatable by owner" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Policies: books
create policy "Books are selectable by authenticated users" on public.books
  for select using (auth.role() = 'authenticated');

create policy "Books insertable by admins" on public.books
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Books updatable by admins" on public.books
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Books deletable by admins" on public.books
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Policies: progress (owner-only)
create policy "Progress select by owner" on public.progress
  for select using (user_id = auth.uid());

create policy "Progress insert by owner" on public.progress
  for insert with check (user_id = auth.uid());

create policy "Progress update by owner" on public.progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Progress delete by owner" on public.progress
  for delete using (user_id = auth.uid());

-- Policies: bookmarks (owner-only)
create policy "Bookmarks select by owner" on public.bookmarks
  for select using (user_id = auth.uid());

create policy "Bookmarks insert by owner" on public.bookmarks
  for insert with check (user_id = auth.uid());

create policy "Bookmarks update by owner" on public.bookmarks
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Bookmarks delete by owner" on public.bookmarks
  for delete using (user_id = auth.uid());

-- Policies: highlights (owner-only)
create policy "Highlights select by owner" on public.highlights
  for select using (user_id = auth.uid());

create policy "Highlights insert by owner" on public.highlights
  for insert with check (user_id = auth.uid());

create policy "Highlights update by owner" on public.highlights
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Highlights delete by owner" on public.highlights
  for delete using (user_id = auth.uid());

