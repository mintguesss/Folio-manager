"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, ReferenceLine,
  BarChart, Bar,
} from "recharts";

export type MarketChartData = {
  pie: { name: string; value: number }[];
  stockPnlLines: { symbol: string; name: string | null; line: { date: string; value: number; pct: number }[] }[];
  pnlLine: { date: string; value: number }[];
  returnBar: { symbol: string; pct: number }[];
};

const PIE_COLORS = [
  "#38bdf8","#34d399","#fbbf24","#f472b6","#a78bfa",
  "#fb923c","#22d3ee","#4ade80","#c084fc","#f9a8d4",
];

function fmt(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(v);
}

function fmtSgn(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "-";
  const s = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(Math.abs(v));
  return v > 0 ? "+" + s : v < 0 ? "-" + s : s;
}

function fmtPct(n: unknown) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "-";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

const tooltipStyle = {
  background: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "rgba(229,231,235,0.95)",
};

const axisStyle = { fontSize: 11, fill: "rgba(161,161,170,0.9)" };

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function ChartCard({ title, sub, action, children }: {
  title: string; sub: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {action ?? <span className="text-xs text-zinc-400">{sub}</span>}
      </div>
      <div className="h-52">{children}</div>
    </div>
  );
}

type Range = "3D" | "1W" | "2W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
const RANGE_DAYS: Record<Range, number | null> = {
  "3D": 3, "1W": 7, "2W": 14, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "ALL": null,
};
const RANGE_LABELS: Record<Range, string> = {
  "3D": "3天", "1W": "1週", "2W": "2週", "1M": "1月", "3M": "3月", "6M": "6月", "1Y": "1年", "ALL": "全部",
};

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Range)}
      className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-white/25"
    >
      {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
        <option key={r} value={r}>{RANGE_LABELS[r]}</option>
      ))}
    </select>
  );
}

function sliceByRange(data: { date: string; value: number }[], range: Range) {
  const days = RANGE_DAYS[range];
  if (!days) return data;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= cutoffStr);
}

type StockLine = {
  symbol: string;
  name: string | null;
  line: { date: string; unrealized: number; realized: number; pct_unrealized: number; pct_realized: number; pct_combined: number }[];
};

type LineMode = "combined" | "realized" | "unrealized";
const LINE_MODE_LABELS: Record<LineMode, string> = { combined: "合計", realized: "已實現", unrealized: "未實現" };

type ValueMode = "pnl" | "pct";

export function PnlSummaryChart({
  stockLines,
}: {
  stockLines: StockLine[];
}) {
  const [lineMode, setLineMode] = useState<LineMode>("combined");
  const [valueMode, setValueMode] = useState<ValueMode>("pnl");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [range, setRange] = useState<Range>("ALL");

  const active = stockLines.find((s) => s.symbol === selectedSymbol) ?? stockLines[0];
  const rawLine = active
    ? (() => {
        const days = RANGE_DAYS[range];
        if (!days) return active.line;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return active.line.filter((d) => d.date >= cutoffStr);
      })()
    : [];

  const lineData = rawLine.map((d) => ({
    date: d.date,
    value: valueMode === "pnl"
      ? (lineMode === "combined" ? d.unrealized + d.realized : lineMode === "realized" ? d.realized : d.unrealized)
      : (lineMode === "combined" ? d.pct_combined : lineMode === "realized" ? d.pct_realized : d.pct_unrealized),
  }));

  const isPct = valueMode === "pct";

  return (
    <div>
      {/* Line: per-stock P&L / return trend */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">個股損益走勢</h3>
            <span className="text-xs text-zinc-400">{isPct ? "報酬率 %" : "TWD"}</span>
          </div>
          <div className="mt-2 grid grid-cols-[auto_auto] items-center justify-items-start gap-x-2 gap-y-1.5">
            {stockLines.length > 1 ? (
              <select
                value={active?.symbol ?? ""}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="max-w-[8rem] truncate rounded-lg border border-white/10 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300 outline-none"
              >
                {stockLines.map((s) => (
                  <option key={s.symbol} value={s.symbol}>{s.name ?? s.symbol}</option>
                ))}
              </select>
            ) : <div />}
            <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
              {(["combined", "realized", "unrealized"] as LineMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setLineMode(m)}
                  className={["px-2.5 py-1 transition-colors",
                    lineMode === m ? "bg-violet-500/30 text-violet-300" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}>
                  {LINE_MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <RangePicker value={range} onChange={setRange} />
            <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
              {(["pnl", "pct"] as ValueMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setValueMode(m)}
                  className={["px-2.5 py-1 transition-colors",
                    valueMode === m ? "bg-sky-500/30 text-sky-300" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}>
                  {m === "pnl" ? "損益" : "報酬率"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-52">
          {lineData.length < 2 ? (
            <Empty text="尚無歷史報價" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={axisStyle} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={axisStyle} tickFormatter={isPct ? (v) => v + "%" : fmtSgn} width={isPct ? 52 : 80} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Tooltip
                  formatter={(v) => isPct ? [fmtPct(v) , LINE_MODE_LABELS[lineMode]] : [fmtSgn(v), LINE_MODE_LABELS[lineMode]]}
                  labelFormatter={(l) => `日期：${l}`}
                  contentStyle={tooltipStyle}
                />
                <Line type="linear" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketChartsPanel({
  data,
  market,
}: {
  data: MarketChartData;
  market: "TW" | "US";
}) {
  const currency = market === "TW" ? "TWD" : "USD";
  const [totalRange, setTotalRange] = useState<Range>("1W");
  const [stockRange, setStockRange] = useState<Range>("ALL");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [stockMode, setStockMode] = useState<"pnl" | "pct">("pnl");

  const lineData = sliceByRange(data.pnlLine, totalRange);

  // Per-stock P&L
  const stocks = data.stockPnlLines;
  const activeSymbol = stocks.some((s) => s.symbol === selectedSymbol)
    ? selectedSymbol
    : stocks[0]?.symbol ?? "";
  const activeStock = stocks.find((s) => s.symbol === activeSymbol);
  const stockLineData = activeStock ? sliceByRange(activeStock.line, stockRange) : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 1. Holdings pie */}
      <ChartCard title="持股分布" sub={currency}>
        {data.pie.length === 0 ? (
          <Empty text="尚無報價資料" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.pie} dataKey="value" nameKey="name" innerRadius="35%" outerRadius="65%" paddingAngle={3}>
                {data.pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, ""]} contentStyle={tooltipStyle} />
              <Legend formatter={(v) => <span style={{ color: "rgba(229,231,235,0.8)", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 2. Per-stock P&L / Return line */}
      <ChartCard
        title="個股損益走勢"
        sub={currency}
        action={
          <div className="flex items-center gap-2">
            {stocks.length > 1 && (
              <select
                value={activeSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="max-w-[8rem] truncate rounded-lg border border-white/10 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-white/25"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.name ?? s.symbol}
                  </option>
                ))}
              </select>
            )}
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setStockMode("pnl")}
                className={["px-2 py-0.5 transition-colors", stockMode === "pnl" ? "bg-violet-500/30 text-violet-300" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"].join(" ")}
              >損益</button>
              <button
                type="button"
                onClick={() => setStockMode("pct")}
                className={["px-2 py-0.5 transition-colors", stockMode === "pct" ? "bg-emerald-500/30 text-emerald-300" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"].join(" ")}
              >報酬率</button>
            </div>
            <RangePicker value={stockRange} onChange={setStockRange} />
          </div>
        }
      >
        {stockLineData.length === 0 ? (
          <Empty text="尚無歷史報價" />
        ) : stockMode === "pnl" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockLineData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={axisStyle} tickFormatter={fmtSgn} width={80} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(v) => [`${fmtSgn(v)} ${currency}`, "損益"]}
                labelFormatter={(l) => `日期：${l}`}
                contentStyle={tooltipStyle}
              />
              <Line type="linear" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockLineData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={axisStyle} tickFormatter={(v) => v + "%"} width={52} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(v) => [fmtPct(v), "報酬率"]}
                labelFormatter={(l) => `日期：${l}`}
                contentStyle={tooltipStyle}
              />
              <Line type="linear" dataKey="pct" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 3. Total P&L line */}
      <ChartCard
        title="總損益走勢"
        sub="TWD，以歷史報價估算"
        action={<RangePicker value={totalRange} onChange={setTotalRange} />}
      >
        {lineData.length === 0 ? (
          <Empty text="尚無報價資料" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={axisStyle} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={axisStyle} tickFormatter={fmtSgn} width={80} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(v) => [fmtSgn(v), "損益"]}
                labelFormatter={(l) => `日期：${l}`}
                contentStyle={tooltipStyle}
              />
              <Line
                type="linear"
                dataKey="value"
                name="損益"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 3, fill: "#38bdf8" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 4. Return % bar */}
      <ChartCard title="報酬率" sub="未實現獲利 %">
        {data.returnBar.length === 0 ? (
          <Empty text="尚無報價資料" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.returnBar} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="symbol" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => v + "%"} width={52} />
              <Tooltip
                formatter={(v) => [fmtPct(v), "報酬率"]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="pct" name="報酬率" radius={[4, 4, 0, 0]}>
                {data.returnBar.map((d, i) => (
                  <Cell key={i} fill={d.pct >= 0 ? "#34d399" : "#f87171"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
