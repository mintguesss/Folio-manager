"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { deleteTrade } from "@/app/actions/stocks";
import { DeleteButton } from "@/components/DeleteButton";

export type TradeItem = {
  id: string;
  trade_date: string;
  market: string;
  symbol: string;
  name: string | null;
  side: string;
  quantity: number;
  price: number;
  currency: string;
  fee: number;
  tax: number;
  note: string | null;
};

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 4 }).format(n);
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={["h-3.5 w-3.5 shrink-0 transition-transform duration-150", open ? "rotate-180" : ""].join(" ")}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TradesTable({ trades }: { trades: TradeItem[] }) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [openTradeId, setOpenTradeId] = useState<string | null>(null);

  function toggleMonth(month: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  }

  // Group by YYYY-MM
  const groups: { month: string; items: TradeItem[] }[] = [];
  for (const t of trades) {
    const month = t.trade_date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(t);
    else groups.push({ month, items: [t] });
  }

  const empty = (
    <p className="py-10 text-center text-sm text-zinc-400">
      尚無交易。去{" "}
      <Link href="/stocks/trades/new" className="font-medium underline">新增交易</Link>
      。
    </p>
  );

  if (groups.length === 0) return empty;

  const sideCls = (side: string) =>
    side === "BUY" ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300";
  const sideLabel = (side: string) => side === "BUY" ? "買" : "賣";
  const sideFullLabel = (side: string) => side === "BUY" ? "買進" : "賣出";

  return (
    <>
      {/* ── 手機：accordion cards ── */}
      <div className="sm:hidden space-y-0 overflow-hidden rounded-xl border border-white/10">
        {groups.map(({ month, items }) => {
          const isMonthCollapsed = collapsedMonths.has(month);
          return (
            <div key={month}>
              {/* Month header */}
              <button
                type="button"
                onClick={() => toggleMonth(month)}
                className="flex w-full items-center gap-2.5 border-t-2 border-white/10 bg-white/[0.04] px-4 py-2.5 text-left first:border-t-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={["h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150", isMonthCollapsed ? "-rotate-90" : ""].join(" ")}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="text-sm font-semibold text-zinc-300">{formatMonth(month)}</span>
                <span className="text-xs text-zinc-400">{items.length} 筆</span>
              </button>

              {/* Trades in month */}
              {!isMonthCollapsed && (
                <div className="divide-y divide-white/5">
                  {items.map((t) => {
                    const isOpen = openTradeId === t.id;
                    const hasExtra = t.fee > 0 || t.tax > 0 || t.note;
                    return (
                      <div key={t.id}>
                        {/* Collapsed row */}
                        <button
                          type="button"
                          onClick={() => setOpenTradeId(isOpen ? null : t.id)}
                          className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
                        >
                          <span className="w-[5.5rem] shrink-0 tabular-nums text-xs text-zinc-400">
                            {t.trade_date}
                          </span>
                          <span className={["inline-flex shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold", sideCls(t.side)].join(" ")}>
                            {sideLabel(t.side)}
                          </span>
                          <span className="flex-1 text-sm font-medium text-white">
                            {t.market === "TW" ? (t.name ?? t.symbol) : t.symbol}
                          </span>
                          <span className="shrink-0 tabular-nums text-xs text-zinc-300">
                            {fmt(t.quantity)} × {fmt(t.price)}
                          </span>
                          <Chevron open={isOpen} />
                        </button>

                        {/* Expanded */}
                        {isOpen && (
                          <div className="border-t border-white/5 bg-white/[0.015] px-3 pb-3 pt-2.5">
                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-zinc-500">市場</span>
                                <span className="text-zinc-300">{t.market === "TW" ? "台股" : "美股"}</span>
                              </div>
                              {t.name && t.market === "TW" && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-zinc-500">代號</span>
                                  <span className="text-zinc-300">{t.symbol}</span>
                                </div>
                              )}
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-zinc-500">幣別</span>
                                <span className="text-zinc-300">{t.currency}</span>
                              </div>
                              {(t.fee > 0 || t.tax > 0) && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-zinc-500">費稅</span>
                                  <span className="text-zinc-300">{fmt(t.fee + t.tax)}</span>
                                </div>
                              )}
                              {t.note && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-zinc-500">備註</span>
                                  <span className="text-zinc-300">{t.note}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-1">
                              <Link
                                href={`/stocks/trades/edit/${t.id}`}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                              >
                                修改
                              </Link>
                              <form action={deleteTrade}>
                                <input type="hidden" name="id" value={t.id} />
                                <DeleteButton />
                              </form>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 電腦：table ── */}
      <div className="hidden sm:block overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-black/40 text-xs text-zinc-300">
            <tr>
              <th className="px-3 py-2 font-medium">日期</th>
              <th className="px-3 py-2 font-medium">市場</th>
              <th className="px-3 py-2 font-medium">股票</th>
              <th className="px-3 py-2 font-medium">買/賣</th>
              <th className="px-3 py-2 font-medium text-right">數量</th>
              <th className="px-3 py-2 font-medium text-right">成交價</th>
              <th className="px-3 py-2 font-medium text-right">費用</th>
              <th className="px-3 py-2 font-medium text-right">稅</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map(({ month, items }) => {
              const isMonthCollapsed = collapsedMonths.has(month);
              return (
                <Fragment key={month}>
                  <tr>
                    <td colSpan={9} className="border-t-2 border-white/10 bg-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => toggleMonth(month)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          className={["h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-150", isMonthCollapsed ? "-rotate-90" : ""].join(" ")}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span className="text-sm font-semibold text-zinc-300">{formatMonth(month)}</span>
                        <span className="text-xs text-zinc-400">{items.length} 筆</span>
                      </button>
                    </td>
                  </tr>
                  {!isMonthCollapsed && items.map((t) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-zinc-300">{t.trade_date}</td>
                      <td className="px-3 py-2 text-zinc-400">{t.market === "TW" ? "台股" : "美股"}</td>
                      <td className="px-3 py-2">
                        <div className={["font-medium text-white", t.market === "TW" && t.name && t.name.length < 4 ? "whitespace-nowrap" : ""].join(" ")}>
                          {t.market === "TW" ? (t.name ?? t.symbol) : t.symbol}
                        </div>
                        {t.name && (
                          <div className="text-xs text-zinc-400">
                            {t.market === "TW" ? t.symbol : t.name}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={["inline-flex rounded-lg px-2 py-1 text-xs font-semibold", sideCls(t.side)].join(" ")}>
                          {sideFullLabel(t.side)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{fmt(t.quantity)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300 whitespace-nowrap">
                        {fmt(t.price)} {t.currency}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{fmt(t.fee)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{fmt(t.tax)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/stocks/trades/edit/${t.id}`}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                          >
                            修改
                          </Link>
                          <form action={deleteTrade}>
                            <input type="hidden" name="id" value={t.id} />
                            <DeleteButton />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
