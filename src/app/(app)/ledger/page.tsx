import { createClient } from "@/lib/supabase/server";
import { createLedgerEntry } from "@/app/actions/ledger";
import { LedgerClient } from "./LedgerClient";

export default async function LedgerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("ledger_entries")
    .select("id,occurred_on,entry_type,amount,account,category_text,counterparty,memo,created_at")
    .eq("user_id", user?.id ?? "")
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">一般記帳</h1>
        <p className="mt-1 text-sm text-zinc-400">收入 / 支出 / 轉帳，自由記錄。</p>
      </div>

      <LedgerClient entries={entries ?? []} createAction={createLedgerEntry} />
    </div>
  );
}
