-- ==========================================
-- 初期スキーマ定義 (Supabase / PostgreSQL)
-- ==========================================

-- 1. users (ユーザー情報: auth.usersと同期)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')) default 'user',
  display_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;
-- 誰でも表示可能
create policy "Users are viewable by everyone" on public.users for select using (true);
-- 本人のみ作成・更新可能
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

-- 2. books (書籍マスタ)
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text,
  cover_url text,
  total_copies integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;
-- 誰でも閲覧可能
create policy "Books are viewable by everyone" on public.books for select using (true);
-- 管理者のみ追加・更新・削除可能
create policy "Books are insertable by admins" on public.books for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Books are updatable by admins" on public.books for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Books are deletable by admins" on public.books for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 3. book_items (物理的な1冊ごとの管理)
create type public.book_item_status as enum ('available', 'borrowed', 'lost');

create table public.book_items (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  status public.book_item_status not null default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.book_items enable row level security;
create policy "Book items are viewable by everyone" on public.book_items for select using (true);
create policy "Book items are insertable by admins" on public.book_items for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Book items status can be updated by any user during loan/return" on public.book_items for update using (true);
create policy "Book items are deletable by admins" on public.book_items for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 4. loans (貸出記録 - 誰がどの本を借りているか)
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  book_item_id uuid not null references public.book_items(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  borrowed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  returned_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.loans enable row level security;
create policy "Loans are viewable by everyone" on public.loans for select using (true);
create policy "Loans are insertable by users for themselves or by admins" on public.loans for insert with check (
  auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Loans are updatable by users for themselves or by admins" on public.loans for update using (
  auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 5. reading_statuses (ユーザー個人の読書状況)
create type public.reading_status_type as enum ('unread', 'reading', 'read');

create table public.reading_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status public.reading_status_type not null default 'unread',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

alter table public.reading_statuses enable row level security;
-- 本人のみ閲覧可能
create policy "Reading statuses viewable by owner" on public.reading_statuses for select using (auth.uid() = user_id);
-- 本人のみ追加・更新・削除可能
create policy "Reading statuses manipulatable by owner" on public.reading_statuses for all using (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_reading_statuses_updated_at
  before update on public.reading_statuses
  for each row execute procedure public.handle_updated_at();

-- 新規ユーザー登録時に public.users に自動でレコードを作成するトリガー (オプションですが便利)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
