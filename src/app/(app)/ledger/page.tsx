import { createClient, getUser } from "@/lib/supabase/server";
import { createLedgerEntry } from "@/app/actions/ledger";
import { LedgerClient } from "./LedgerClient";
import { LedgerInbox } from "./LedgerInbox";

export default async function LedgerPage() {
  const supabase = await createClient();
  const user = await getUser();
  const uid = user?.id ?? "";

  const [{ data: entries }, { data: inbox }, { data: rules }, { count: tokenCount }] = await Promise.all([
    supabase
      .from("ledger_entries")
      .select("id,occurred_on,entry_type,amount,account,category_text,counterparty,memo,created_at")
      .eq("user_id", uid)
      .order("occurred_on", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("ledger_inbox")
      .select("id,source,raw_text,amount,merchant,account,received_at")
      .eq("user_id", uid)
      .eq("status", "pending")
      .order("received_at", { ascending: false })
      .limit(100),
    supabase.from("ledger_merchant_rules").select("merchant,category_text,account").eq("user_id", uid),
    supabase.from("ingest_tokens").select("user_id", { count: "exact", head: true }).eq("user_id", uid),
  ]);

  const usedCategories = Array.from(
    new Set((entries ?? []).map((e) => e.category_text).filter((c): c is string => !!c))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">一般記帳</h1>
        <p className="mt-1 text-sm text-zinc-400">收入 / 支出 / 轉帳，自由記錄。</p>
      </div>

      <LedgerInbox
        items={inbox ?? []}
        rules={rules ?? []}
        hasToken={(tokenCount ?? 0) > 0}
        usedCategories={usedCategories}
      />

      <LedgerClient entries={entries ?? []} createAction={createLedgerEntry} />
    </div>
  );
}
