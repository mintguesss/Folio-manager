-- ============================================================
-- 一般記帳：手機通知自動匯入
--   手機（MacroDroid）把付款通知 POST 到 /api/ingest，
--   進到 ledger_inbox 等確認；確認時記住「商店 → 類別」。
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- 待確認的通知
create table if not exists public.ledger_inbox (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  source       text,                 -- 通知標題（誰傳的，例如銀行、LINE Pay）
  raw_text     text        not null, -- 通知原文
  amount       numeric,
  merchant     text,
  account      text,                 -- 推測的付款方式
  received_at  timestamptz not null default now(),
  status       text        not null default 'pending' check (status in ('pending', 'done', 'ignored')),
  dedup_key    text        not null, -- 同一則通知重複送來時擋掉
  created_at   timestamptz not null default now(),
  constraint ledger_inbox_dedup_uniq unique (user_id, dedup_key)
);

create index if not exists ledger_inbox_user_status_idx
  on public.ledger_inbox (user_id, status, received_at desc);

alter table public.ledger_inbox enable row level security;

drop policy if exists "ledger_inbox_own" on public.ledger_inbox;
create policy "ledger_inbox_own" on public.ledger_inbox
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 商店 → 類別 / 付款方式（確認時自動學）
create table if not exists public.ledger_merchant_rules (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  merchant      text        not null,
  category_text text,
  account       text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, merchant)
);

alter table public.ledger_merchant_rules enable row level security;

drop policy if exists "ledger_merchant_rules_own" on public.ledger_merchant_rules;
create policy "ledger_merchant_rules_own" on public.ledger_merchant_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 手機用的金鑰（只存雜湊，每人一把，重新產生就換掉）
create table if not exists public.ingest_tokens (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  token_hash  text        not null unique,
  created_at  timestamptz not null default now()
);

alter table public.ingest_tokens enable row level security;

drop policy if exists "ingest_tokens_own" on public.ingest_tokens;
create policy "ingest_tokens_own" on public.ingest_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 給 /api/ingest 呼叫：用金鑰找到使用者後寫進 inbox（手機端沒有登入狀態）
create or replace function public.ingest_ledger_notification(
  p_token    text,
  p_source   text,
  p_raw_text text,
  p_amount   numeric,
  p_merchant text,
  p_account  text
) returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid;
  v_key  text;
begin
  select user_id into v_user
  from public.ingest_tokens
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if v_user is null then
    return 'bad_token';
  end if;

  -- 同一則通知在同一分鐘內重送視為重複
  v_key := encode(extensions.digest(
    coalesce(p_source, '') || '|' || p_raw_text || '|' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
    'sha256'), 'hex');

  insert into public.ledger_inbox (user_id, source, raw_text, amount, merchant, account, dedup_key)
  values (v_user, p_source, left(p_raw_text, 1000), p_amount, left(p_merchant, 100), p_account, v_key)
  on conflict (user_id, dedup_key) do nothing;

  return 'ok';
end;
$$;

revoke all on function public.ingest_ledger_notification(text, text, text, numeric, text, text) from public;
grant execute on function public.ingest_ledger_notification(text, text, text, numeric, text, text) to anon, authenticated;
