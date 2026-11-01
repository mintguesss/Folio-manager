-- ============================================================
-- 一般記帳：同一筆消費的兩則通知合併
--   例如 LINE Pay 綁信用卡付款，會同時收到 LINE Pay 和銀行的通知。
--   1 分鐘內、同金額、不同來源 → 視為同一筆：
--     還在待確認 → 併進原本那筆（補商店名稱、原文接在後面）
--     已入帳 / 不記 → 直接略過
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================

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
  v_twin public.ledger_inbox%rowtype;
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

  if exists (select 1 from public.ledger_inbox where user_id = v_user and dedup_key = v_key) then
    return 'duplicate';
  end if;

  -- 同一筆消費的另一則通知（不同來源、同金額、1 分鐘內）
  if p_amount is not null then
    select * into v_twin
    from public.ledger_inbox
    where user_id = v_user
      and amount = p_amount
      and coalesce(source, '') <> coalesce(p_source, '')
      and received_at > now() - interval '1 minute'
    order by received_at desc
    limit 1;

    if found then
      if v_twin.status = 'pending' then
        update public.ledger_inbox
        set merchant = coalesce(merchant, left(p_merchant, 100)),
            -- 付款方式以 LINE Pay 為準（記帳時通常記 LinePay），其餘保留先到的
            account  = case when p_account = 'LinePay' then p_account else coalesce(account, p_account) end,
            raw_text = left(raw_text || E'\n──\n' || coalesce(p_source || '：', '') || p_raw_text, 2000)
        where id = v_twin.id;
      end if;
      return 'merged';
    end if;
  end if;

  insert into public.ledger_inbox (user_id, source, raw_text, amount, merchant, account, dedup_key)
  values (v_user, p_source, left(p_raw_text, 1000), p_amount, left(p_merchant, 100), p_account, v_key)
  on conflict (user_id, dedup_key) do nothing;

  return 'ok';
end;
$$;

revoke all on function public.ingest_ledger_notification(text, text, text, numeric, text, text) from public;
grant execute on function public.ingest_ledger_notification(text, text, text, numeric, text, text) to anon, authenticated;
