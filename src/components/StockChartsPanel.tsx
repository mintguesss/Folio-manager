"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

export type StockChartData = {
  pieBySymbol: { name: string; value: number }[];
  pieByMarket: { name: string; value: number }[];
  pnlBar: { symbol: string; unrealized: number; realized: number }[];
  portfolioLine: { date: string; value: number }[];
};

const COLORS = [
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#4ade80",
  "#c084fc",
  "#f9a8d4",
];

function fmt(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(v);
}

const tooltipStyle = {
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "rgba(229,231,235,0.95)",
};

const axisStyle = { fontSize: 11, fill: "rgba(161,161,170,0.9)" };

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function PieSection({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
}) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-zinc-400">{subtitle}</span>
      </div>
      <div className="h-64">
        {!hasData ? (
          <EmptyState text="尚無報價資料" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${fmt(v)} TWD`, ""]}
                contentStyle={tooltipStyle}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ color: "rgba(229,231,235,0.8)", fontSize: 12 }}>
                    {v}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PortfolioLine({ data }: { data: { date: string; value: number }[] }) {
  const hasData = data.length >= 2;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">組合市值走勢</h3>
        <span className="text-xs text-zinc-400">TWD，依報價紀錄估算</span>
      </div>
      <div className="h-64">
        {!hasData ? (
          <EmptyState text="需要多筆報價才能顯示走勢" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={axisStyle}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={axisStyle} tickFormatter={fmt} width={72} />
              <Tooltip
                formatter={(v) => [fmt(v), "市值"]}
                labelFormatter={(l) => `日期：${l}`}
                contentStyle={tooltipStyle}
              />
              <Line
                type="linear"
                dataKey="value"
                name="組合市值"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 3, fill: "#38bdf8" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PnLBar({
  data,
}: {
  data: { symbol: string; unrealized: number; realized: number }[];
}) {
  const hasData = data.length > 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">個股損益</h3>
        <span className="text-xs text-zinc-400">TWD，已實現 + 未實現</span>
      </div>
      <div className="h-64">
        {!hasData ? (
          <EmptyState text="尚無損益資料" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="symbol" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={fmt} width={72} />
              <Tooltip
                formatter={(v) => [fmt(v), ""]}
                contentStyle={tooltipStyle}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ color: "rgba(229,231,235,0.8)", fontSize: 12 }}>
                    {v}
                  </span>
                )}
              />
              <Bar
                dataKey="unrealized"
                name="未實現"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="realized"
                name="已實現"
                fill="#34d399"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function StockChartsPanel({ data }: { data: StockChartData }) {
  const { pieBySymbol, pieByMarket, pnlBar, portfolioLine } = data;
  const [pieMode, setPieMode] = useState<"held" | "all">("held");

  const totalPnlPie = useMemo(
    () =>
      pnlBar
        .map((d) => ({ name: d.symbol, value: d.unrealized + d.realized }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value),
    [pnlBar]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["held", "all"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPieMode(m)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                pieMode === m
                  ? "bg-white/10 text-white border border-white/20"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              ].join(" ")}
            >
              {m === "held" ? "持有市值" : "損益合計（含已實現）"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {pieMode === "held" ? (
            <>
              <PieSection title="持股市值分布" subtitle="各標的占比（TWD）" data={pieBySymbol} />
              <PieSection title="台美股比例" subtitle="按市場分類（TWD）" data={pieByMarket} />
            </>
          ) : (
            <>
              <PieSection title="損益合計分布" subtitle="未實現＋已實現（正值，TWD）" data={totalPnlPie} />
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-white">損益合計明細</h3>
                  <span className="text-xs text-zinc-400">TWD</span>
                </div>
                <div className="space-y-1.5">
                  {pnlBar.map((d) => {
                    const total = d.unrealized + d.realized;
                    return (
                      <div key={d.symbol} className="flex items-baseline justify-between text-xs">
                        <span className="text-zinc-300">{d.symbol}</span>
                        <div className="text-right">
                          <span className={["tabular-nums font-semibold", total >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
                            {total >= 0 ? "+" : ""}{new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(total)}
                          </span>
                          <span className="ml-2 text-zinc-600 tabular-nums">
                            未{d.unrealized >= 0 ? "+" : ""}{new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(d.unrealized)}
                            {" / "}
                            已{d.realized >= 0 ? "+" : ""}{new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(d.realized)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <PortfolioLine data={portfolioLine} />
      <PnLBar data={pnlBar} />
    </div>
  );
}
