"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type LedgerEntry = {
  entry_type: string | null;
  amount: number;
  category_text: string | null;
};

const COLORS = ["#fb7185", "#38bdf8", "#34d399", "#a78bfa", "#fbbf24", "#f97316", "#e879f9", "#94a3b8"];

function fmt(n: unknown) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(num);
}

export function LedgerCategoryChart({ entries }: { entries: LedgerEntry[] }) {
  const data = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if ((e.entry_type ?? "expense") !== "expense") continue;
      const cat = e.category_text?.trim() || "其他";
      m.set(cat, (m.get(cat) ?? 0) + Number(e.amount ?? 0));
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  return (
    <div className="h-48 sm:h-64 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">支出分類</h2>
        <span className="text-xs text-zinc-300">費用分布</span>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">尚無支出紀錄</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="60%"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => fmt(v)}
              contentStyle={{
                background: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "rgba(229,231,235,0.95)",
                fontSize: 12,
              }}
            />
            <Legend
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "rgba(229,231,235,0.75)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
