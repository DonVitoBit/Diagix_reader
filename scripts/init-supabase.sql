-- Enable необходимые расширения
create extension if not exists "pg_trgm";

-- Создаем перечисления
create type book_format as enum ('epub', 'pdf');
create type report_status as enum ('pending', 'in_progress', 'resolved', 'rejected');
create type report_type as enum ('incorrect', 'typo', 'formatting', 'other');

-- Создаем таблицы
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
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
  updated_at timestamptz default now()
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

create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  cfi text not null,
  selected_text text not null,
  type report_type not null,
  description text not null,
  suggestion text,
  status report_status not null default 'pending',
  admin_note text,
  resolution text,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  updated_at timestamptz default now()
);

-- Создаем индексы
create index if not exists books_title_idx on books using gin(title gin_trgm_ops);
create index if not exists books_author_idx on books using gin(author gin_trgm_ops);
create index if not exists progress_user_id_idx on progress(user_id);
create index if not exists progress_book_id_idx on progress(book_id);
create index if not exists bookmarks_user_id_idx on bookmarks(user_id);
create index if not exists bookmarks_book_id_idx on bookmarks(book_id);
create index if not exists highlights_user_id_idx on highlights(user_id);
create index if not exists highlights_book_id_idx on highlights(book_id);
create index if not exists reports_status_idx on reports(status);
create index if not exists reports_user_id_idx on reports(user_id);
create index if not exists reports_book_id_idx on reports(book_id);

-- Создаем функции
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Создаем триггеры
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at();

create trigger update_books_updated_at
  before update on books
  for each row
  execute function update_updated_at();

create trigger update_progress_updated_at
  before update on progress
  for each row
  execute function update_updated_at();

create trigger update_bookmarks_updated_at
  before update on bookmarks
  for each row
  execute function update_updated_at();

create trigger update_highlights_updated_at
  before update on highlights
  for each row
  execute function update_updated_at();

create trigger update_reports_updated_at
  before update on reports
  for each row
  execute function update_updated_at();

-- Создаем политики безопасности
alter table profiles enable row level security;
alter table books enable row level security;
alter table progress enable row level security;
alter table bookmarks enable row level security;
alter table highlights enable row level security;
alter table reports enable row level security;

-- Политики для profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Политики для books
create policy "Anyone can view books"
  on books for select
  using (true);

create policy "Only admins can insert books"
  on books for insert
  with check (exists (
    select 1 from profiles
    where id = auth.uid()
    and is_admin = true
  ));

create policy "Only admins can update books"
  on books for update
  using (exists (
    select 1 from profiles
    where id = auth.uid()
    and is_admin = true
  ));

-- Политики для progress
create policy "Users can view own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on progress for update
  using (auth.uid() = user_id);

-- Политики для bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

-- Политики для highlights
create policy "Users can view own highlights"
  on highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert own highlights"
  on highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own highlights"
  on highlights for update
  using (auth.uid() = user_id);

-- Политики для reports
create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = user_id);

create policy "Users can insert reports"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "Only admins can update reports"
  on reports for update
  using (exists (
    select 1 from profiles
    where id = auth.uid()
    and is_admin = true
  ));
