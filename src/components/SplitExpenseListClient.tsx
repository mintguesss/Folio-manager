"use client";

import { useState, useMemo, useCallback } from "react";
import { SplitExpenseCard } from "@/components/SplitExpenseCard";

type SplitExpense = {
  id: string;
  paid_by: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  exchange_rate: number | null;
  category: string | null;
  note: string | null;
  payment_method: string | null;
  account: string | null;
};

type Share = { id: string; expense_id: string; member_id: string; share_amount: number; is_settled: boolean };
type Member = { id: string; name: string; is_self: boolean; sort_order?: number };

const fmt = (n: number) => new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
const fmtJPY = (n: number) => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(n);

function dayTotal(expenses: SplitExpense[]) {
  return expenses.reduce((sum, e) => {
    const amt = Number(e.amount);
    if (e.currency === "JPY" && e.exchange_rate) return sum + Math.round(amt * Number(e.exchange_rate));
    return sum + amt;
  }, 0);
}

export function SplitExpenseListClient({
  expenses,
  shares,
  members,
  groupId,
  exportedIds,
  selfMemberId,
}: {
  expenses: SplitExpense[];
  shares: Share[];
  members: Member[];
  groupId: string;
  exportedIds: string[];
  selfMemberId: string | undefined;
}) {
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  const sharesByExpense = useMemo(() => {
    const m = new Map<string, Share[]>();
    for (const s of shares) {
      const arr = m.get(s.expense_id) ?? [];
      arr.push(s);
      m.set(s.expense_id, arr);
    }
    return m;
  }, [shares]);

  const exportedSet = useMemo(() => new Set(exportedIds), [exportedIds]);

  const categories = useMemo(
    () => [...new Set(expenses.map(e => e.category).filter((v): v is string => !!v))].sort(),
    [expenses]
  );

  const paymentMethods = useMemo(
    () => [...new Set(
      expenses.map(e => e.payment_method || e.account).filter((v): v is string => !!v)
    )].sort(),
    [expenses]
  );

  const payers = useMemo(() => {
    const ids = [...new Set(expenses.map(e => e.paid_by))];
    return ids
      .map(id => ({ id, name: memberMap.get(id)?.name ?? "?" }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
  }, [expenses, memberMap]);

  const [catFilter, setCatFilter] = useState("all");
  const [pmFilter, setPmFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");

  const filtered = useMemo(
    () => expenses.filter(e =>
      (catFilter === "all" || e.category === catFilter) &&
      (pmFilter === "all" || (e.payment_method || e.account) === pmFilter) &&
      (payerFilter === "all" || e.paid_by === payerFilter)
    ),
    [expenses, catFilter, pmFilter, payerFilter]
  );

  const filteredTotal = useMemo(() => dayTotal(filtered), [filtered]);

  const filteredJPY = useMemo(
    () => filtered.filter(e => e.currency === "JPY").reduce((s, e) => s + Number(e.amount), 0),
    [filtered]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, SplitExpense[]>();
    for (const e of filtered) {
      const arr = m.get(e.expense_date) ?? [];
      arr.push(e);
      m.set(e.expense_date, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleDate = useCallback((date: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  }, []);

  const selectClass = "rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer";

  return (
    <div className="space-y-4">
      {(categories.length > 0 || paymentMethods.length > 0 || payers.length > 1) && (
        <div className="flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={selectClass}>
              <option value="all">全部類別</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {paymentMethods.length > 0 && (
            <select value={pmFilter} onChange={e => setPmFilter(e.target.value)} className={selectClass}>
              <option value="all">全部支付方式</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {payers.length > 1 && (
            <select value={payerFilter} onChange={e => setPayerFilter(e.target.value)} className={selectClass}>
              <option value="all">全部付款者</option>
              {payers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <span className="ml-auto text-xs text-zinc-600 tabular-nums">
            {filteredJPY > 0 && `¥${fmtJPY(filteredJPY)} · `}{fmt(filteredTotal)} TWD · {filtered.length} 筆
          </span>
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">無符合條件的支出</p>
      ) : (
        <div className="space-y-1">
          {grouped.map(([date, dateExpenses]) => {
            const isCollapsed = collapsed.has(date);
            const total = dayTotal(dateExpenses);
            return (
              <div key={date}>
                <button
                  type="button"
                  onClick={() => toggleDate(date)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <span className="flex-1 text-sm font-semibold text-zinc-200">{date}</span>
                  <span className="tabular-nums text-sm font-medium text-rose-300">{fmt(total)}</span>
                  <span className="text-xs text-zinc-500">{dateExpenses.length} 筆</span>
                  <svg
                    className={["h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", isCollapsed ? "" : "rotate-180"].join(" ")}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="mt-1 space-y-3 pl-0">
                    {dateExpenses.map(e => (
                      <SplitExpenseCard
                        key={e.id}
                        expense={e}
                        shares={sharesByExpense.get(e.id) ?? []}
                        members={members}
                        groupId={groupId}
                        isExported={exportedSet.has(e.id)}
                        selfMemberId={selfMemberId}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
