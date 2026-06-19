"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type LedgerEntry = {
  occurred_on: string;
  entry_type: string | null;
  amount: number;
};

function formatNumber(n: unknown) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(num);
}

export function LedgerChart({ entries }: { entries: LedgerEntry[] }) {
  const { data, isDaily } = useMemo(() => {
    const months = new Set(entries.map((e) => e.occurred_on.slice(0, 7)));
    const isDaily = months.size <= 1;

    const m = new Map<string, { key: string; income: number; expense: number; transfer: number }>();
    for (const e of entries) {
      const key = isDaily ? e.occurred_on : e.occurred_on.slice(0, 7);
      const row = m.get(key) ?? { key, income: 0, expense: 0, transfer: 0 };
      const t = e.entry_type ?? "expense";
      const amt = Number(e.amount ?? 0);
      if (t === "income") row.income += amt;
      else if (t === "transfer") row.transfer += amt;
      else row.expense += amt;
      m.set(key, row);
    }
    return {
      data: Array.from(m.values()).sort((a, b) => (a.key > b.key ? 1 : -1)),
      isDaily,
    };
  }, [entries]);

  // For daily view, show only the day number (DD) on XAxis
  const tickFormatter = isDaily ? (v: string) => v.slice(8) : undefined;

  return (
    <div className="h-48 sm:h-64 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">
          {isDaily ? "每日統計" : "每月統計"}
        </h2>
        <span className="text-xs text-zinc-300">收入 / 支出（轉帳單獨顯示）</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="key"
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }} tickFormatter={formatNumber} />
          <Tooltip
            formatter={(v) => formatNumber(v)}
            labelFormatter={isDaily ? (l) => `${l}` : undefined}
            contentStyle={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "rgba(229,231,235,0.95)",
            }}
          />
          <Legend />
          <Bar dataKey="income" name="收入" fill="#34d399" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="支出" fill="#fb7185" radius={[6, 6, 0, 0]} />
          <Bar dataKey="transfer" name="轉帳" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
