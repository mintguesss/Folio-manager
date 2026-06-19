"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export type NetWorthPoint = {
  snapshot_date: string;
  total_assets: number;
  bank_huanan: number;
  bank_ctbc: number;
  bank_post: number;
  bank_taishin: number;
};

function fmt(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(v);
}

export function NetWorthHistoryChart({ data }: { data: NetWorthPoint[] }) {
  return (
    <div className="h-80 w-full rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">總資產 / 銀行歷史</h2>
        <span className="text-xs text-zinc-300">總資產、華南、中國信託、郵局、台新</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="snapshot_date" tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }} />
          <YAxis tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }} tickFormatter={fmt} />
          <Tooltip
            formatter={(v) => fmt(v)}
            contentStyle={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "rgba(229,231,235,0.95)",
            }}
          />
          <Legend />
          <Line type="linear" dataKey="total_assets" name="總資產" stroke="#e5e7eb" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="bank_huanan" name="華南" stroke="#38bdf8" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="bank_ctbc" name="中國信託" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="bank_post" name="郵局" stroke="#fbbf24" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="bank_taishin" name="台新" stroke="#f472b6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

