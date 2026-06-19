import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateLedgerEntry } from "@/app/actions/ledger";
import { LedgerEntryForm } from "../../LedgerEntryForm";

export default async function LedgerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entry } = await supabase
    .from("ledger_entries")
    .select("id,occurred_on,entry_type,amount,account,category_text,counterparty,memo")
    .eq("user_id", user?.id ?? "")
    .eq("id", id)
    .single();

  if (!entry) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/ledger"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
        >
          返回
        </Link>
        <h1 className="text-lg font-semibold text-white">修改記帳</h1>
      </div>

      <div className="max-w-lg">
        <LedgerEntryForm
          onUpdate={updateLedgerEntry}
          initial={{
            id: entry.id,
            occurred_on: entry.occurred_on,
            entry_type: entry.entry_type ?? "expense",
            amount: Number(entry.amount),
            account: entry.account,
            category_text: entry.category_text,
            counterparty: entry.counterparty,
            memo: entry.memo,
          }}
        />
      </div>
    </div>
  );
}
