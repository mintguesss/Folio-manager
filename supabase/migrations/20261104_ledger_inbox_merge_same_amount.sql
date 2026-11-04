-- ============================================================
-- 一般記帳：通知合併改成只看金額和時間
--   1 分鐘內、同金額就視為同一筆，不管來源是否相同
--   （同一則付款通知可能因為更新或重送，用不同內容送來兩次）。
--   同一使用者的請求排隊處理，避免同時送來時兩筆都寫進去。
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

  -- 同一使用者同時送來的通知排隊，第二則才看得到第一則
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  -- 同一則通知在同一分鐘內重送視為重複
  v_key := encode(extensions.digest(
    coalesce(p_source, '') || '|' || p_raw_text || '|' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
    'sha256'), 'hex');

  if exists (select 1 from public.ledger_inbox where user_id = v_user and dedup_key = v_key) then
    return 'duplicate';
  end if;

  -- 同一筆消費的另一則通知（同金額、1 分鐘內）
  if p_amount is not null then
    select * into v_twin
    from public.ledger_inbox
    where user_id = v_user
      and amount = p_amount
      and received_at > now() - interval '1 minute'
    order by received_at desc
    limit 1;

    if found then
      if v_twin.status = 'pending' then
        update public.ledger_inbox
        set merchant = coalesce(merchant, left(p_merchant, 100)),
            -- 付款方式以 LINE Pay 為準（記帳時通常記 LinePay），其餘保留先到的
            account  = case when p_account = 'LinePay' then p_account else coalesce(account, p_account) end,
            -- 同來源只是同一則重送，不用再接一次原文
            raw_text = case
              when coalesce(source, '') = coalesce(p_source, '') then raw_text
              else left(raw_text || E'\n──\n' || coalesce(p_source || '：', '') || p_raw_text, 2000)
            end
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
