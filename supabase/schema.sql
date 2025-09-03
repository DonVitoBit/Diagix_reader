-- Enable necessary extensions
create extension if not exists "pg_trgm";

-- Create custom types
create type book_format as enum ('epub', 'pdf');

-- Create tables
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  language text not null default 'en',
  format book_format not null,
  cover_url text not null,
  file_path text not null,
  checksum text not null unique,
  size_bytes bigint not null,
  year integer,
  isbn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B')
  ) stored
);

create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  loc text not null,
  percent numeric not null check (percent >= 0 and percent <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, book_id)
);

create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  cfi text not null,
  note text,
  category text not null default 'other',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists highlights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  cfi_range text not null,
  text text not null,
  color text not null default 'yellow',
  note text,
  page_number integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists books_ts_idx on books using gin(ts);
create index if not exists books_title_idx on books using gin(title gin_trgm_ops);
create index if not exists books_author_idx on books using gin(author gin_trgm_ops);
create index if not exists progress_user_id_idx on progress(user_id);
create index if not exists progress_book_id_idx on progress(book_id);
create index if not exists bookmarks_user_id_idx on bookmarks(user_id);
create index if not exists bookmarks_book_id_idx on bookmarks(book_id);
create index if not exists highlights_user_id_idx on highlights(user_id);
create index if not exists highlights_book_id_idx on highlights(book_id);

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_books_updated_at
  before update on books
  for each row
  execute function update_updated_at_column();

create trigger update_progress_updated_at
  before update on progress
  for each row
  execute function update_updated_at_column();

create trigger update_bookmarks_updated_at
  before update on bookmarks
  for each row
  execute function update_updated_at_column();

create trigger update_highlights_updated_at
  before update on highlights
  for each row
  execute function update_updated_at_column();

-- Create function to check if user is admin
create or replace function is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from auth.users
    where id = user_id
    and raw_user_meta_data->>'is_admin' = 'true'
  );
end;
$$ language plpgsql security definer;

-- Enable Row Level Security
alter table profiles enable row level security;
alter table books enable row level security;
alter table progress enable row level security;
alter table bookmarks enable row level security;
alter table highlights enable row level security;

-- Create RLS policies

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Books policies
create policy "Anyone can view books"
  on books for select
  using (true);

create policy "Only admins can insert books"
  on books for insert
  with check (is_admin(auth.uid()));

create policy "Only admins can update books"
  on books for update
  using (is_admin(auth.uid()));

create policy "Only admins can delete books"
  on books for delete
  using (is_admin(auth.uid()));

-- Progress policies
create policy "Users can view own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on progress for delete
  using (auth.uid() = user_id);

-- Bookmarks policies
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Highlights policies
create policy "Users can view own highlights"
  on highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert own highlights"
  on highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own highlights"
  on highlights for update
  using (auth.uid() = user_id);

create policy "Users can delete own highlights"
  on highlights for delete
  using (auth.uid() = user_id);

-- Create storage buckets
insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict do nothing;

-- Create storage policies
create policy "Anyone can view covers"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "Only admins can upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and is_admin(auth.uid())
  );

create policy "Authenticated users can download books"
  on storage.objects for select
  using (
    bucket_id = 'books'
    and auth.role() = 'authenticated'
  );

create policy "Only admins can upload books"
  on storage.objects for insert
  with check (
    bucket_id = 'books'
    and is_admin(auth.uid())
  );
