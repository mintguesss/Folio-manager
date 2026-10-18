-- ============================================================
-- Complete Schema — run once in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. ASSET SNAPSHOTS  （資產記帳）
-- ============================================================

create table if not exists public.asset_snapshots (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  snapshot_date date        not null,
  total_assets  numeric     not null default 0,
  bank_huanan   numeric     not null default 0,
  bank_ctbc     numeric     not null default 0,
  bank_post     numeric     not null default 0,
  bank_taishin  numeric     not null default 0,
  tw_stock_value numeric    not null default 0,
  us_stock_value numeric    not null default 0,
  breakdown     jsonb       not null default '{}'::jsonb,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint asset_snapshots_user_date_uniq unique(user_id, snapshot_date)
);

create index if not exists asset_snapshots_user_date_idx
  on public.asset_snapshots (user_id, snapshot_date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists asset_snapshots_set_updated_at on public.asset_snapshots;
create trigger asset_snapshots_set_updated_at
  before update on public.asset_snapshots
  for each row execute procedure public.set_updated_at();

alter table public.asset_snapshots enable row level security;

drop policy if exists "asset_snapshots_select_own" on public.asset_snapshots;
create policy "asset_snapshots_select_own"
  on public.asset_snapshots for select using (auth.uid() = user_id);

drop policy if exists "asset_snapshots_insert_own" on public.asset_snapshots;
create policy "asset_snapshots_insert_own"
  on public.asset_snapshots for insert with check (auth.uid() = user_id);

drop policy if exists "asset_snapshots_update_own" on public.asset_snapshots;
create policy "asset_snapshots_update_own"
  on public.asset_snapshots for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_snapshots_delete_own" on public.asset_snapshots;
create policy "asset_snapshots_delete_own"
  on public.asset_snapshots for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. LEDGER  （一般記帳）
-- ============================================================

create table if not exists public.ledger_categories (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  type       text        not null check (type in ('income', 'expense', 'transfer')),
  created_at timestamptz not null default now(),
  constraint ledger_categories_user_name_uniq unique(user_id, name, type)
);

create table if not exists public.ledger_entries (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  occurred_on   date        not null,
  entry_type    text        check (entry_type is null or entry_type in ('income', 'expense', 'transfer')),
  amount        numeric     not null,
  currency      text        not null default 'TWD',
  account       text,
  category_id   uuid        references public.ledger_categories(id) on delete set null,
  category_text text,
  counterparty  text,
  memo          text,
  created_at    timestamptz not null default now()
);

create index if not exists ledger_entries_user_date_idx
  on public.ledger_entries (user_id, occurred_on desc);

alter table public.ledger_categories enable row level security;
alter table public.ledger_entries    enable row level security;

drop policy if exists "ledger_categories_select_own" on public.ledger_categories;
create policy "ledger_categories_select_own"
  on public.ledger_categories for select using (auth.uid() = user_id);

drop policy if exists "ledger_categories_insert_own" on public.ledger_categories;
create policy "ledger_categories_insert_own"
  on public.ledger_categories for insert with check (auth.uid() = user_id);

drop policy if exists "ledger_categories_update_own" on public.ledger_categories;
create policy "ledger_categories_update_own"
  on public.ledger_categories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ledger_categories_delete_own" on public.ledger_categories;
create policy "ledger_categories_delete_own"
  on public.ledger_categories for delete using (auth.uid() = user_id);

drop policy if exists "ledger_entries_select_own" on public.ledger_entries;
create policy "ledger_entries_select_own"
  on public.ledger_entries for select using (auth.uid() = user_id);

drop policy if exists "ledger_entries_insert_own" on public.ledger_entries;
create policy "ledger_entries_insert_own"
  on public.ledger_entries for insert with check (auth.uid() = user_id);

drop policy if exists "ledger_entries_update_own" on public.ledger_entries;
create policy "ledger_entries_update_own"
  on public.ledger_entries for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ledger_entries_delete_own" on public.ledger_entries;
create policy "ledger_entries_delete_own"
  on public.ledger_entries for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. STOCKS  （股票記帳）
-- ============================================================

create table if not exists public.stock_trades (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  market     text        not null check (market in ('TW', 'US')),
  symbol     text        not null,
  name       text,
  trade_date date        not null,
  side       text        not null check (side in ('BUY', 'SELL')),
  quantity   numeric     not null check (quantity > 0),
  price      numeric     not null check (price >= 0),
  currency   text        not null default 'TWD',
  fee        numeric     not null default 0 check (fee >= 0),
  tax        numeric     not null default 0 check (tax >= 0),
  fx_rate    numeric,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists stock_trades_user_date_idx
  on public.stock_trades (user_id, trade_date desc);

create index if not exists stock_trades_user_symbol_idx
  on public.stock_trades (user_id, market, symbol);

create table if not exists public.stock_quotes (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  market     text        not null check (market in ('TW', 'US')),
  symbol     text        not null,
  quote_date date        not null,
  close      numeric     not null check (close >= 0),
  prev_close numeric,
  currency   text        not null,
  created_at timestamptz not null default now(),
  constraint stock_quotes_user_symbol_date_uniq unique(user_id, market, symbol, quote_date)
);

-- Add prev_close to existing tables (idempotent)
alter table public.stock_quotes add column if not exists prev_close numeric;

-- Add fx_rate to stock_trades (idempotent)
alter table public.stock_trades add column if not exists fx_rate numeric;

create index if not exists stock_quotes_user_symbol_date_idx
  on public.stock_quotes (user_id, market, symbol, quote_date desc);

alter table public.stock_trades enable row level security;
alter table public.stock_quotes enable row level security;

drop policy if exists "stock_trades_select_own" on public.stock_trades;
create policy "stock_trades_select_own"
  on public.stock_trades for select using (auth.uid() = user_id);

drop policy if exists "stock_trades_insert_own" on public.stock_trades;
create policy "stock_trades_insert_own"
  on public.stock_trades for insert with check (auth.uid() = user_id);

drop policy if exists "stock_trades_update_own" on public.stock_trades;
create policy "stock_trades_update_own"
  on public.stock_trades for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "stock_trades_delete_own" on public.stock_trades;
create policy "stock_trades_delete_own"
  on public.stock_trades for delete using (auth.uid() = user_id);

drop policy if exists "stock_quotes_select_own" on public.stock_quotes;
create policy "stock_quotes_select_own"
  on public.stock_quotes for select using (auth.uid() = user_id);

drop policy if exists "stock_quotes_insert_own" on public.stock_quotes;
create policy "stock_quotes_insert_own"
  on public.stock_quotes for insert with check (auth.uid() = user_id);

drop policy if exists "stock_quotes_update_own" on public.stock_quotes;
create policy "stock_quotes_update_own"
  on public.stock_quotes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "stock_quotes_delete_own" on public.stock_quotes;
create policy "stock_quotes_delete_own"
  on public.stock_quotes for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. TRAVEL EXPENSES  （出國記帳）
-- ============================================================

create table if not exists public.travel_expenses (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  trip_name     text        not null default '未命名行程',
  occurred_on   date        not null,
  category      text        not null default '其他',
  description   text,
  amount_jpy      numeric     not null check (amount_jpy >= 0),
  exchange_rate   numeric     not null check (exchange_rate > 0),
  payment_method  text,
  created_at      timestamptz not null default now()
);

alter table public.travel_expenses add column if not exists payment_method text;
-- 幣別（amount_jpy 存的是該幣別金額），見 migrations/20261018_travel_currency.sql
alter table public.travel_expenses add column if not exists currency text not null default 'JPY';

create index if not exists travel_expenses_user_trip_idx
  on public.travel_expenses (user_id, trip_name, occurred_on desc);

alter table public.travel_expenses enable row level security;

drop policy if exists "travel_expenses_select_own" on public.travel_expenses;
create policy "travel_expenses_select_own"
  on public.travel_expenses for select using (auth.uid() = user_id);

drop policy if exists "travel_expenses_insert_own" on public.travel_expenses;
create policy "travel_expenses_insert_own"
  on public.travel_expenses for insert with check (auth.uid() = user_id);

drop policy if exists "travel_expenses_update_own" on public.travel_expenses;
create policy "travel_expenses_update_own"
  on public.travel_expenses for update using (auth.uid() = user_id);

drop policy if exists "travel_expenses_delete_own" on public.travel_expenses;
create policy "travel_expenses_delete_own"
  on public.travel_expenses for delete using (auth.uid() = user_id);
