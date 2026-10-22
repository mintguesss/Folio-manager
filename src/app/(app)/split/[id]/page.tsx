import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { SettlementModal } from "@/components/SettlementModal";
import { SplitExpenseListClient } from "@/components/SplitExpenseListClient";
import { fmtFx, toTravelCurrency } from "@/lib/currency";

function fmt(n: number, dp = 0) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: dp }).format(n);
}

export default async function SplitGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: group }, { data: members }, { data: expenses }, { data: myGroupUserRows }] = await Promise.all([
    // Allow both owner and members (RLS enforces access)
    supabase
      .from("split_groups")
      .select("id, name, group_type, currency, description, user_id")
      .eq("id", id)
      .single(),
    supabase
      .from("split_members")
      .select("id, name, is_self, sort_order")
      .eq("group_id", id)
      .order("sort_order"),
    supabase
      .from("split_expenses")
      .select("id, paid_by, description, amount, currency, expense_date, exchange_rate, category, note, payment_method, account, created_at")
      .eq("group_id", id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("split_group_users")
      .select("member_id")
      .eq("group_id", id)
      .eq("user_id", user?.id ?? "")
      .limit(1),
  ]);

  if (!group) notFound();

  const isOwner = group.user_id === user?.id;

  // Determine which member represents the current user
  const selfMemberId =
    myGroupUserRows?.[0]?.member_id ??
    (members ?? []).find((m) => m.is_self)?.id;

  const expenseIds = (expenses ?? []).map((e) => e.id);
  const [{ data: shares }, exportedTravel, exportedLedger] = await (expenseIds.length > 0
    ? Promise.all([
        supabase
          .from("split_shares")
          .select("id, expense_id, member_id, share_amount, is_settled")
          .in("expense_id", expenseIds),
        supabase
          .from("travel_expenses")
          .select("split_expense_id")
          .eq("user_id", user?.id ?? "")
          .in("split_expense_id", expenseIds),
        supabase
          .from("ledger_entries")
          .select("split_expense_id")
          .eq("user_id", user?.id ?? "")
          .in("split_expense_id", expenseIds),
      ])
    : Promise.all([{ data: [] }, { data: [] }, { data: [] }]));

  const exportedIds = new Set<string>();
  for (const r of exportedTravel?.data ?? []) {
    if (r.split_expense_id) exportedIds.add(r.split_expense_id as string);
  }
  for (const r of exportedLedger?.data ?? []) {
    if (r.split_expense_id) exportedIds.add(r.split_expense_id as string);
  }

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  type Share = { id: string; expense_id: string; member_id: string; share_amount: number; is_settled: boolean };
  const sharesByExpense = new Map<string, Share[]>();
  for (const s of shares ?? []) {
    if (!sharesByExpense.has(s.expense_id)) sharesByExpense.set(s.expense_id, []);
    sharesByExpense.get(s.expense_id)!.push(s);
  }

  // Unsettled debts grouped by (debtor, creditor)；外幣金額以群組幣別計
  const groupCurrency = toTravelCurrency(group.currency);
  const debtMap = new Map<string, { fx: number; twd: number }>();
  for (const e of expenses ?? []) {
    const rate = e.exchange_rate ? Number(e.exchange_rate) : null;
    const isFx = e.currency !== "TWD";
    for (const s of sharesByExpense.get(e.id) ?? []) {
      if (s.is_settled || s.member_id === e.paid_by) continue;
      const k = `${s.member_id}:${e.paid_by}`;
      const prev = debtMap.get(k) ?? { fx: 0, twd: 0 };
      const amt = Number(s.share_amount);
      debtMap.set(k, isFx
        ? { fx: prev.fx + amt, twd: prev.twd + (rate ? Math.round(amt * rate) : 0) }
        : { fx: prev.fx, twd: prev.twd + amt }
      );
    }
  }
  const debts = Array.from(debtMap.entries())
    .map(([k, { fx, twd }]) => {
      const [debtor_id, creditor_id] = k.split(":");
      return { debtor_id, creditor_id, fx, twd };
    })
    .filter((d) => d.fx > 0.005 || d.twd > 0.005);

  const typeLabel = group.group_type === "travel" ? "出國" : "一般";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/split"
              className="shrink-0 rounded-lg p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <h1 className="min-w-0 truncate text-lg font-semibold text-white">{group.name}</h1>
            <span className="shrink-0 whitespace-nowrap rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-400">
              {typeLabel}
            </span>
            {!isOwner && (
              <span className="shrink-0 whitespace-nowrap rounded bg-sky-500/10 px-1.5 py-0.5 text-xs text-sky-400">共享</span>
            )}
          </div>
          {group.description && (
            <p className="mt-0.5 pl-7 text-sm text-zinc-400">{group.description}</p>
          )}
          <p className="mt-0.5 pl-7 text-xs text-zinc-500">
            {(members ?? []).map((m) =>
              m.name + (m.id === selfMemberId ? "（我）" : "")
            ).join("、")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOwner && (
            <Link
              href={`/split/${id}/members`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors"
            >
              成員
            </Link>
          )}
          <Link
            href={`/split/${id}/expense/new`}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            新增支出
          </Link>
        </div>
      </div>

      {/* Settlement summary */}
      {debts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-300/80">待結清</h2>
            <SettlementModal
              debts={debts}
              members={(members ?? []).map((m) => ({ id: m.id, name: m.name }))}
              groupId={id}
              selfMemberId={selfMemberId}
              currency={groupCurrency}
            />
          </div>
          <div className="space-y-2">
            {debts.map((d) => {
              const debtor = memberMap.get(d.debtor_id);
              const creditor = memberMap.get(d.creditor_id);
              if (!debtor || !creditor) return null;
              const debtorIsMe = d.debtor_id === selfMemberId;
              const creditorIsMe = d.creditor_id === selfMemberId;
              return (
                <div key={`${d.debtor_id}:${d.creditor_id}`} className="flex items-center gap-2 text-sm">
                  <span className={debtorIsMe ? "font-semibold text-white" : "text-zinc-200"}>
                    {debtor.name}{debtorIsMe && <span className="ml-1 text-xs text-zinc-400">（我）</span>}
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className={creditorIsMe ? "font-semibold text-white" : "text-zinc-200"}>
                    {creditor.name}{creditorIsMe && <span className="ml-1 text-xs text-zinc-400">（我）</span>}
                  </span>
                  <div className="ml-auto space-y-0.5 text-right">
                    {d.twd > 0 && (
                      <div className="tabular-nums font-semibold text-rose-300">
                        {fmt(d.twd)} <span className="text-xs font-normal text-rose-400/60">TWD</span>
                      </div>
                    )}
                    {d.fx > 0 && (
                      <div className={["tabular-nums text-xs", d.twd > 0 ? "text-zinc-500" : "font-semibold text-rose-300"].join(" ")}>
                        {fmtFx(d.fx, groupCurrency)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {debts.length === 0 && (expenses ?? []).length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm font-medium text-emerald-400">
          全部結清！
        </div>
      )}

      {/* Expense list */}
      {(expenses ?? []).length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          還沒有支出，{" "}
          <Link href={`/split/${id}/expense/new`} className="text-sky-400 hover:underline">
            新增第一筆
          </Link>
          。
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">支出明細</h2>
          <SplitExpenseListClient
            expenses={expenses ?? []}
            shares={shares ?? []}
            members={members ?? []}
            groupId={id}
            exportedIds={Array.from(exportedIds)}
            selfMemberId={selfMemberId}
          />
        </div>
      )}
    </div>
  );
}
