"use client";

import { useState, useMemo } from "react";
import { LedgerChart } from "@/components/LedgerChart";
import { LedgerCategoryChart } from "@/components/LedgerCategoryChart";
import { LedgerEntryForm } from "./LedgerEntryForm";
import { LedgerRecordList } from "./LedgerRecordList";
import type { LedgerEntry } from "./LedgerRecordList";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function LedgerClient({
  entries,
  createAction,
}: {
  entries: LedgerEntry[];
  createAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const months = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(e.occurred_on.slice(0, 7));
    return Array.from(s).sort().reverse();
  }, [entries]);

  const [month, setMonth] = useState<string>(() => {
    const cur = currentMonthKey();
    return months.includes(cur) ? cur : months[0] ?? "all";
  });

  const filtered = useMemo(
    () => (month === "all" ? entries : entries.filter((e) => e.occurred_on.startsWith(month))),
    [entries, month]
  );

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    for (const e of filtered) {
      const amt = Number(e.amount ?? 0);
      if (e.entry_type === "income") income += amt;
      else if (e.entry_type !== "transfer") expense += amt;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <LedgerEntryForm onCreate={createAction} />
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">紀錄</h2>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
                {filtered.length} 筆
              </span>
            </div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部月份</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {/* 摘要列 */}
          <div className="mb-4 grid grid-cols-3 divide-x divide-white/8 rounded-xl border border-white/8 bg-white/[0.03]">
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-zinc-500">收入</p>
              <p className="mt-0.5 tabular-nums text-sm font-semibold text-emerald-300">+{fmt(summary.income)}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-zinc-500">支出</p>
              <p className="mt-0.5 tabular-nums text-sm font-semibold text-rose-300">-{fmt(summary.expense)}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-zinc-500">結餘</p>
              <p className={`mt-0.5 tabular-nums text-sm font-semibold ${summary.net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {summary.net >= 0 ? "+" : ""}{fmt(summary.net)}
              </p>
            </div>
          </div>

          <LedgerRecordList entries={filtered} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LedgerChart entries={filtered} />
        <LedgerCategoryChart entries={filtered} />
      </div>
    </>
  );
}
