-- ============================================================
-- 出國記帳 / 出國分帳 多幣別（日圓 + 新加坡幣，出國記帳另可記台幣）
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================

-- 出國記帳：每筆支出的幣別（amount_jpy 欄位沿用，存的是該幣別的金額）
alter table public.travel_expenses
  add column if not exists currency text not null default 'JPY';

alter table public.travel_expenses drop constraint if exists travel_expenses_currency_check;
alter table public.travel_expenses
  add constraint travel_expenses_currency_check check (currency in ('JPY', 'SGD', 'TWD'));

-- 分帳群組：出國群組使用的幣別（一般群組不使用）
alter table public.split_groups
  add column if not exists currency text not null default 'JPY';

alter table public.split_groups drop constraint if exists split_groups_currency_check;
alter table public.split_groups
  add constraint split_groups_currency_check check (currency in ('JPY', 'SGD'));

-- 把名稱有「新加坡」的出國分帳群組設成新加坡幣
update public.split_groups
  set currency = 'SGD'
  where group_type = 'travel' and name like '%新加坡%';
