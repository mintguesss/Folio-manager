"use client";

import { useState } from "react";

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: d }).format(n);
}
function fmtSgn(n: number, d = 0) {
  const s = fmt(Math.abs(n), d);
  return n > 0 ? "+" + s : n < 0 ? "-" + s : s;
}

export type TradeRow = {
  index: number;
  trade_date: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  runningQty: number;
  runningAvg: number;
  realizedPnl: number | null;
  realizedPnlTWD: number | null;
};

export type StockPosition = {
  symbol: string;
  name: string | null;
  currency: string;
  trades: TradeRow[];
  finalQty: number;
  finalAvg: number;
  realizedPnl: number;
  realizedCost?: number;
  realizedPnlTWD?: number | null;
  currentPrice: number | null;
  unrealized: number | null;
  unrealizedTWD?: number | null;
  unrealizedPct: number | null;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={["h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TradeTable({ trades, dim, currency }: { trades: TradeRow[]; dim?: boolean; currency: string }) {
  const dp = currency === "USD" ? 2 : 0;
  return (
    <div className="overflow-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-xs">
        <thead className="bg-black/40 text-zinc-400">
          <tr>
            <th className="px-3 py-2.5 font-medium">日期</th>
            <th className="px-3 py-2.5 font-medium">操作</th>
            <th className="px-3 py-2.5 font-medium text-right">股數</th>
            <th className="px-3 py-2.5 font-medium text-right">成交價</th>
            <th className="px-3 py-2.5 font-medium text-right">費稅</th>
            <th className="px-3 py-2.5 font-medium text-right">攤後均價</th>
            <th className="px-3 py-2.5 font-medium text-right">持股</th>
            <th className="px-3 py-2.5 font-medium text-right">損益</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((tr) => (
            <tr key={tr.index} className="border-t border-white/5">
              <td className={["whitespace-nowrap px-3 py-2.5", dim ? "text-zinc-500" : "text-zinc-300"].join(" ")}>
                {tr.trade_date}
              </td>
              <td className="px-3 py-2.5">
                <span className={[
                  "inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold",
                  tr.side === "BUY" ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300",
                ].join(" ")}>
                  {tr.side === "BUY" ? "買進" : "賣出"}
                </span>
              </td>
              <td className={[
                "px-3 py-2.5 text-right tabular-nums text-sm font-semibold",
                dim ? "text-zinc-400" : "text-white",
              ].join(" ")}>
                {fmt(tr.quantity)}
              </td>
              <td className={["px-3 py-2.5 tabular-nums text-right", dim ? "text-zinc-400" : "text-white"].join(" ")}>
                {fmt(tr.price, 2)}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-right text-zinc-500">
                {tr.fee + tr.tax > 0 ? fmt(tr.fee + tr.tax) : "—"}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-right">
                {tr.side === "BUY"
                  ? <span className={dim ? "text-zinc-500" : "text-sky-300"}>{fmt(tr.runningAvg, 2)}</span>
                  : <span className="text-zinc-500">—</span>}
              </td>
              <td className={["px-3 py-2.5 tabular-nums text-right", dim ? "text-zinc-500" : "text-zinc-300"].join(" ")}>
                {fmt(tr.runningQty)}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-right">
                {tr.realizedPnl != null ? (() => {
                  const cb = tr.price * tr.quantity - tr.fee - tr.tax - tr.realizedPnl;
                  const pct = cb > 0 ? (tr.realizedPnl / cb) * 100 : null;
                  const col = tr.realizedPnl >= 0 ? "text-emerald-300" : "text-rose-300";
                  return (
                    <>
                      <span className={col}>{fmtSgn(tr.realizedPnl, dp)}</span>
                      {pct != null && (
                        <div className={["text-xs", tr.realizedPnl >= 0 ? "text-emerald-300/60" : "text-rose-300/60"].join(" ")}>
                          {fmtSgn(pct, 2)}%
                        </div>
                      )}
                      {tr.realizedPnlTWD != null && (
                        <div className="text-xs text-zinc-400">
                          ≈{fmtSgn(Math.round(tr.realizedPnlTWD))}
                        </div>
                      )}
                    </>
                  );
                })() : <span className="text-zinc-700">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PositionCard({ pos, open, onToggle, dim }: {
  pos: StockPosition;
  open: boolean;
  onToggle: () => void;
  dim?: boolean;
}) {
  const dp = pos.currency === "USD" ? 2 : 0;
  const isUS = pos.currency === "USD";
  const labelCls = dim ? "text-zinc-400" : "text-zinc-300";
  const valueCls = dim ? "text-zinc-300" : "text-zinc-200";
  return (
    <div className={[
      "rounded-2xl border overflow-hidden backdrop-blur",
      dim ? "border-white/5 bg-black/20" : "border-white/10 bg-black/30",
    ].join(" ")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isUS ? (
              <>
                <span className={["whitespace-nowrap font-semibold", dim ? "text-zinc-300" : "text-white"].join(" ")}>
                  {pos.symbol}
                </span>
                {pos.name && (
                  <span className={["hidden text-xs sm:inline", dim ? "text-zinc-500" : "text-zinc-400"].join(" ")}>
                    {pos.name}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className={["whitespace-nowrap font-semibold", dim ? "text-zinc-300" : "text-white"].join(" ")}>
                  {pos.name ?? pos.symbol}
                </span>
                {pos.name && (
                  <span className={["text-xs", dim ? "text-zinc-500" : "text-zinc-400"].join(" ")}>
                    {pos.symbol}
                  </span>
                )}
              </>
            )}
            {dim && <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-400">已出清</span>}
          </div>
          <div className={["mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs", labelCls].join(" ")}>
            {pos.finalQty > 0 && (
              <span>持股 <span className={valueCls}>{fmt(pos.finalQty)}</span> 股</span>
            )}
            {pos.finalQty > 0 && (
              <span>均價 <span className={valueCls}>{fmt(pos.finalAvg, 2)}</span></span>
            )}
            {pos.currentPrice != null && pos.finalQty > 0 && (
              <span>市價 <span className={valueCls}>{fmt(pos.currentPrice, 2)}</span></span>
            )}
            {pos.currentPrice != null && pos.finalQty > 0 && (
              <span>市值 <span className={valueCls}>{fmt(pos.currentPrice * pos.finalQty, dp)}</span></span>
            )}
            {pos.finalQty > 0 && pos.finalAvg > 0 && (
              <span>成本 <span className={valueCls}>{fmt(pos.finalAvg * pos.finalQty, dp)}</span></span>
            )}
            {pos.finalQty <= 0 && pos.realizedCost != null && pos.realizedCost > 0 && (
              <span>成本 <span className={valueCls}>{fmt(pos.realizedCost, dp)}</span></span>
            )}
            {pos.realizedPnl !== 0 && pos.finalQty > 0 && (
              <span>已實現 <span className={pos.realizedPnl >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}>{fmtSgn(pos.realizedPnl, dp)}</span></span>
            )}
            <span>{pos.trades.length} 筆交易</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* P&L or realized */}
          {pos.unrealized != null ? (
            <div className="text-right">
              <div className={["text-sm font-semibold tabular-nums", pos.unrealized >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
                {fmtSgn(pos.unrealized, dp)}
              </div>
              {pos.unrealizedPct != null && (
                <div className={["text-xs tabular-nums", pos.unrealized >= 0 ? "text-emerald-300/60" : "text-rose-300/60"].join(" ")}>
                  {fmtSgn(pos.unrealizedPct, 2)}%
                </div>
              )}
              {pos.unrealizedTWD != null && (
                <div className="text-xs text-zinc-400 tabular-nums">
                  ≈{fmtSgn(Math.round(pos.unrealizedTWD))} TWD
                </div>
              )}
            </div>
          ) : pos.realizedPnl !== 0 ? (() => {
            const pct = pos.realizedCost && pos.realizedCost > 0
              ? (pos.realizedPnl / pos.realizedCost) * 100 : null;
            return (
              <div className="text-right">
                <div className={["text-sm font-semibold tabular-nums", pos.realizedPnl >= 0 ? "text-emerald-300" : "text-rose-300"].join(" ")}>
                  {fmtSgn(pos.realizedPnl, dp)}
                </div>
                {pct != null && (
                  <div className={["text-xs tabular-nums", pos.realizedPnl >= 0 ? "text-emerald-300/60" : "text-rose-300/60"].join(" ")}>
                    {fmtSgn(pct, 2)}%
                  </div>
                )}
                {pos.realizedPnlTWD != null && (
                  <div className="text-xs text-zinc-400 tabular-nums">
                    ≈{fmtSgn(Math.round(pos.realizedPnlTWD))} TWD
                  </div>
                )}
              </div>
            );
          })() : null}
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          <TradeTable trades={pos.trades} dim={dim} currency={pos.currency} />
        </div>
      )}
    </div>
  );
}

export function StockCostAccordion({
  heldPositions,
  closedPositions,
}: {
  heldPositions: StockPosition[];
  closedPositions: StockPosition[];
}) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  function toggle(symbol: string) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  const allKeys = [
    ...heldPositions.map((p) => p.symbol),
    ...closedPositions.map((p) => `closed:${p.symbol}`),
  ];
  const allOpen = allKeys.every((k) => openSet.has(k));

  function toggleAll() {
    if (allOpen) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(allKeys));
    }
  }

  const total = heldPositions.length + closedPositions.length;
  if (total === 0) return null;

  return (
    <div className="space-y-4">
      {total > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {allOpen ? "收合全部" : "展開全部"}
          </button>
        </div>
      )}

      {heldPositions.length > 0 && (
        <div className="space-y-2">
          {heldPositions.map((pos) => (
            <PositionCard
              key={pos.symbol}
              pos={pos}
              open={openSet.has(pos.symbol)}
              onToggle={() => toggle(pos.symbol)}
            />
          ))}
        </div>
      )}

      {closedPositions.length > 0 && (
        <>
          <p className="pt-2 text-xs font-medium text-zinc-400">已出清</p>
          <div className="space-y-2">
            {closedPositions.map((pos) => (
              <PositionCard
                key={pos.symbol}
                pos={pos}
                open={openSet.has(`closed:${pos.symbol}`)}
                onToggle={() => toggle(`closed:${pos.symbol}`)}
                dim
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
