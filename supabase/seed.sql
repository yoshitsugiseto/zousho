-- ==========================================
-- テストデータ投入用シード (Supabase / PostgreSQL)
-- ==========================================

-- 1. テストユーザーの作成 (AuthとPublicの紐付け)
-- Supabase Auth に直接インサートするのはハッシュ済みパスワード等が必要で複雑なので、
-- 今回はテストとして `public.users` にダミーレコードを入れつつ、後で画面側からサインアップする前提のIDを指定します。
-- ※ 画面から admin@example.com でサインアップすると、このIDと合致して管理者になります。
-- IDは固定のUUID: '00000000-0000-0000-0000-000000000001'

insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('password123', gen_salt('bf')), -- Supabase標準のbcrypt
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"管理者テストユーザー"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  null,
  false,
  null,
  false
) on conflict (id) do nothing;

-- トリガー（handle_new_user）によって public.users にもレコードが作成されますが、
-- 念のため update で確実に role = admin にしておきます。
update public.users 
set role = 'admin' 
where id = '00000000-0000-0000-0000-000000000001';

-- サブ管理者（admin2@example.com / password123）
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'admin2@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"サブ管理者"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  null,
  false,
  null,
  false
) on conflict (id) do nothing;

update public.users 
set role = 'admin' 
where id = '00000000-0000-0000-0000-000000000003';


-- 一般ユーザー（user@example.com / password123）
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'user@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"一般テストユーザー"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  null,
  false,
  null,
  false
) on conflict (id) do nothing;


-- 2. 書籍の追加
-- UUID を固定して relations を構築しやすくする
DO $$
DECLARE
    book1_id uuid := '11111111-1111-1111-1111-111111111111';
    book2_id uuid := '22222222-2222-2222-2222-222222222222';
    book3_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 本の登録
    insert into public.books (id, title, author, total_copies)
    values
      (book1_id, '達人プログラマー', 'David Thomas', 2),
      (book2_id, 'リーダブルコード', 'Dustin Boswell', 3),
      (book3_id, 'Team Geek', 'Brian W. Fitzpatrick', 1)
    on conflict (id) do nothing;

    -- book_items（冊数分の実体）の登録
    -- book1: 達人プログラマー (2冊)
    insert into public.book_items (id, book_id, status) values 
      ('11111111-0000-0000-0000-000000000001', book1_id, 'available'),
      ('11111111-0000-0000-0000-000000000002', book1_id, 'borrowed')
    on conflict (id) do nothing;

    -- book2: リーダブルコード (3冊)
    insert into public.book_items (id, book_id, status) values 
      ('22222222-0000-0000-0000-000000000001', book2_id, 'available'),
      ('22222222-0000-0000-0000-000000000002', book2_id, 'available'),
      ('22222222-0000-0000-0000-000000000003', book2_id, 'lost')
    on conflict (id) do nothing;

    -- book3: Team Geek (1冊)
    insert into public.book_items (id, book_id, status) values 
      ('33333333-0000-0000-0000-000000000001', book3_id, 'available')
    on conflict (id) do nothing;

    -- 貸出記録 (loans) の追加。達人プログラマーの2冊目（id:...0002）を 一般ユーザーが借りている状況
    insert into public.loans (book_item_id, user_id, borrowed_at)
    values
      ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', now() - interval '3 days')
    on conflict do nothing;
END $$;
