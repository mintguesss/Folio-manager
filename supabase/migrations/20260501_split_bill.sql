-- ============================================================
-- Split Bill Tables (分帳)
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── split_groups ──────────────────────────────────────────────

create table if not exists public.split_groups (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  group_type  text        not null default 'general'
                check (group_type in ('general', 'travel')),
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists split_groups_user_idx
  on public.split_groups (user_id, created_at desc);

alter table public.split_groups enable row level security;

drop policy if exists "split_groups_select" on public.split_groups;
create policy "split_groups_select" on public.split_groups
  for select using (auth.uid() = user_id);

drop policy if exists "split_groups_insert" on public.split_groups;
create policy "split_groups_insert" on public.split_groups
  for insert with check (auth.uid() = user_id);

drop policy if exists "split_groups_update" on public.split_groups;
create policy "split_groups_update" on public.split_groups
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "split_groups_delete" on public.split_groups;
create policy "split_groups_delete" on public.split_groups
  for delete using (auth.uid() = user_id);

-- ── split_members ─────────────────────────────────────────────

create table if not exists public.split_members (
  id         uuid        primary key default uuid_generate_v4(),
  group_id   uuid        not null references public.split_groups(id) on delete cascade,
  name       text        not null,
  is_self    boolean     not null default false,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

alter table public.split_members enable row level security;

drop policy if exists "split_members_select" on public.split_members;
create policy "split_members_select" on public.split_members
  for select using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_members_insert" on public.split_members;
create policy "split_members_insert" on public.split_members
  for insert with check (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_members_update" on public.split_members;
create policy "split_members_update" on public.split_members
  for update using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_members_delete" on public.split_members;
create policy "split_members_delete" on public.split_members
  for delete using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

-- ── split_expenses ────────────────────────────────────────────

create table if not exists public.split_expenses (
  id             uuid        primary key default uuid_generate_v4(),
  group_id       uuid        not null references public.split_groups(id) on delete cascade,
  paid_by        uuid        not null references public.split_members(id),
  description    text        not null,
  amount         numeric     not null,
  currency       text        not null default 'TWD',
  expense_date   date        not null,
  split_type     text        not null default 'equal'
                   check (split_type in ('equal', 'custom')),
  -- travel-type extra fields
  category       text,
  exchange_rate  numeric,
  payment_method text,
  -- general-type extra fields
  category_text  text,
  account        text,
  counterparty   text,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists split_expenses_group_idx
  on public.split_expenses (group_id, expense_date desc);

alter table public.split_expenses enable row level security;

drop policy if exists "split_expenses_select" on public.split_expenses;
create policy "split_expenses_select" on public.split_expenses
  for select using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_expenses_insert" on public.split_expenses;
create policy "split_expenses_insert" on public.split_expenses
  for insert with check (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_expenses_update" on public.split_expenses;
create policy "split_expenses_update" on public.split_expenses
  for update using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

drop policy if exists "split_expenses_delete" on public.split_expenses;
create policy "split_expenses_delete" on public.split_expenses
  for delete using (
    exists (select 1 from public.split_groups g where g.id = group_id and g.user_id = auth.uid())
  );

-- ── split_shares ──────────────────────────────────────────────
-- One row per (expense, member). Payer's own share is auto-settled.

create table if not exists public.split_shares (
  id           uuid        primary key default uuid_generate_v4(),
  expense_id   uuid        not null references public.split_expenses(id) on delete cascade,
  member_id    uuid        not null references public.split_members(id) on delete cascade,
  share_amount numeric     not null,
  is_settled   boolean     not null default false,
  settled_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint split_shares_expense_member_uniq unique(expense_id, member_id)
);

alter table public.split_shares enable row level security;

drop policy if exists "split_shares_select" on public.split_shares;
create policy "split_shares_select" on public.split_shares
  for select using (
    exists (
      select 1 from public.split_expenses e
      join public.split_groups g on g.id = e.group_id
      where e.id = expense_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "split_shares_insert" on public.split_shares;
create policy "split_shares_insert" on public.split_shares
  for insert with check (
    exists (
      select 1 from public.split_expenses e
      join public.split_groups g on g.id = e.group_id
      where e.id = expense_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "split_shares_update" on public.split_shares;
create policy "split_shares_update" on public.split_shares
  for update using (
    exists (
      select 1 from public.split_expenses e
      join public.split_groups g on g.id = e.group_id
      where e.id = expense_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "split_shares_delete" on public.split_shares;
create policy "split_shares_delete" on public.split_shares
  for delete using (
    exists (
      select 1 from public.split_expenses e
      join public.split_groups g on g.id = e.group_id
      where e.id = expense_id and g.user_id = auth.uid()
    )
  );
