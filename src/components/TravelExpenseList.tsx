"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { deleteTravelExpense } from "@/app/actions/travel";
import { DeleteButton } from "@/components/DeleteButton";
import { addFx, fmtFx, fmtFxBag, type FxBag, type TravelCurrency } from "@/lib/currency";

type TravelExpense = {
  id: string;
  trip_name: string;
  occurred_on: string;
  category: string;
  description: string | null;
  amount_jpy: number;
  currency: TravelCurrency;
  exchange_rate: number;
  payment_method: string | null;
};

const CATEGORY_EMOJI: Record<string, string> = {
  食事: "🍜", 住宿: "🏨", 交通: "🚅", 購物: "🛍", 門票: "🎫", 其他: "📦",
};

const fmt = (n: number) => new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);

function ExpenseRow({ expense }: { expense: TravelExpense }) {
  const twd = Math.round(Number(expense.amount_jpy) * Number(expense.exchange_rate));
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-300">
            {CATEGORY_EMOJI[expense.category] ?? ""} {expense.category}
          </span>
          {expense.description && (
            <span className="truncate text-sm text-zinc-200">{expense.description}</span>
          )}
        </div>
        {expense.payment_method && (
          <p className="mt-0.5 text-xs text-zinc-500">{expense.payment_method}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="tabular-nums text-sm font-semibold text-white">{fmt(twd)}</div>
        {expense.currency !== "TWD" && (
          <div className="tabular-nums text-xs text-zinc-500">{fmtFx(Number(expense.amount_jpy), expense.currency)}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={`/travel/edit/${expense.id}`}
          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-white/5"
        >
          修改
        </Link>
        <form action={deleteTravelExpense}>
          <input type="hidden" name="id" value={expense.id} />
          <DeleteButton />
        </form>
      </div>
    </div>
  );
}

export function TravelExpenseList({ expenses }: { expenses: TravelExpense[] }) {
  const categories = useMemo(
    () => [...new Set(expenses.map(e => e.category))].filter(Boolean).sort(),
    [expenses]
  );
  const paymentMethods = useMemo(
    () => [...new Set(expenses.map(e => e.payment_method).filter((v): v is string => !!v))].sort(),
    [expenses]
  );

  const [catFilter, setCatFilter] = useState("all");
  const [pmFilter, setPmFilter] = useState("all");

  const filtered = useMemo(
    () => expenses.filter(e =>
      (catFilter === "all" || e.category === catFilter) &&
      (pmFilter === "all" || e.payment_method === pmFilter)
    ),
    [expenses, catFilter, pmFilter]
  );

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + Math.round(Number(e.amount_jpy) * Number(e.exchange_rate)), 0),
    [filtered]
  );

  const filteredFx = useMemo(
    () => filtered.reduce<FxBag>((bag, e) => e.currency === "TWD" ? bag : addFx(bag, e.currency, Number(e.amount_jpy)), {}),
    [filtered]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, TravelExpense[]>();
    for (const e of filtered) {
      const arr = m.get(e.occurred_on) ?? [];
      arr.push(e);
      m.set(e.occurred_on, arr);
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

  return (
    <div className="space-y-4">
      {(categories.length > 1 || paymentMethods.length > 1) && (
        <div className="flex flex-wrap items-center gap-3">
          {categories.length > 1 && (
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部類別</option>
              {categories.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c] ?? ""} {c}</option>)}
            </select>
          )}
          {paymentMethods.length > 1 && (
            <select
              value={pmFilter}
              onChange={e => setPmFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部支付方式</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <span className="ml-auto text-xs text-zinc-600 tabular-nums">{fmtFxBag(filteredFx) && `${fmtFxBag(filteredFx)} · `}{fmt(filteredTotal)} TWD · {filtered.length} 筆</span>
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">無符合條件的支出</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          {grouped.map(([date, entries], gi) => {
            const isCollapsed = collapsed.has(date);
            const dayTwd = entries.reduce(
              (s, e) => s + Math.round(Number(e.amount_jpy) * Number(e.exchange_rate)), 0
            );
            return (
              <div key={date} className={gi > 0 ? "border-t border-white/5" : ""}>
                <button
                  type="button"
                  onClick={() => toggleDate(date)}
                  className="flex w-full items-center gap-3 bg-white/[0.05] px-3 py-3 text-left"
                >
                  <span className="flex-1 text-sm font-semibold text-zinc-200">{date}</span>
                  <span className="tabular-nums text-sm font-medium text-emerald-400">{fmt(dayTwd)}</span>
                  <span className="text-xs text-zinc-400">{entries.length} 筆</span>
                  <svg
                    className={["h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", isCollapsed ? "" : "rotate-180"].join(" ")}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-white/5">
                    {entries.map(e => <ExpenseRow key={e.id} expense={e} />)}
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
