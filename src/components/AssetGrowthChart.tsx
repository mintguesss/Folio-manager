"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type AssetPoint = {
  snapshot_date: string;
  total_assets: number;
  tw_stock_value: number;
  us_stock_value: number;
};

function formatNumber(n: unknown) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(num);
}

export function AssetGrowthChart({ data }: { data: AssetPoint[] }) {
  return (
    <div className="h-80 w-full rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">資產成長</h2>
        <span className="text-xs text-zinc-300">總資產 / 台股市值 / 美股市值</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="snapshot_date" tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }} />
          <YAxis tick={{ fontSize: 12, fill: "rgba(229,231,235,0.75)" }} tickFormatter={formatNumber} />
          <Tooltip
            formatter={(value) => formatNumber(value)}
            labelFormatter={(label) => `日期：${label}`}
            contentStyle={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "rgba(229,231,235,0.95)",
            }}
          />
          <Legend />
          <Line
            type="linear"
            dataKey="total_assets"
            name="總資產"
            stroke="#e5e7eb"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="linear"
            dataKey="tw_stock_value"
            name="台股市值"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="linear"
            dataKey="us_stock_value"
            name="美股市值"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

