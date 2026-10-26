-- ============================================================
-- 同一天內支出的順序（長按拖曳排序）
-- Safe to re-run. Run in Supabase SQL Editor.
-- 沒排過的是 null，排在當天最上面（照建立時間新→舊）
-- ============================================================

alter table public.travel_expenses add column if not exists sort_order integer;
alter table public.split_expenses  add column if not exists sort_order integer;
