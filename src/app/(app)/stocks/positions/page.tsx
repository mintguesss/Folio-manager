import Link from "next/link";
import { after } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { syncLatestQuotes } from "@/app/actions/quotes";
import { fetchUSDTWD, syncQuotesForUser } from "@/lib/stock-utils";
import { isMarketHours } from "@/lib/market-hours";
import { MarketHoursRefresh } from "@/components/MarketHoursRefresh";
import {
  MarketChartsPanel,
  PnlSummaryChart,
  type MarketChartData,
} from "@/components/MarketChartsPanel";
import { computePositions } from "@/lib/position-calc";
import { BackfillFxButton } from "@/components/BackfillFxButton";
import { StockCostAccordion, type StockPosition } from "@/components/StockCostAccordion";
import { SyncQuotesButton } from "@/components/SyncQuotesButton";

type Trade = {
  market: "TW" | "US";
  symbol: string;
  name: string | null;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  currency: string;
  trade_date: string;
  fx_rate: number | null;
};

type Quote = {
  market: "TW" | "US";
  symbol: string;
  quote_date: string;
  close: number;
  prev_close: number | null;
  currency: string;
};

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: d }).format(n);
}
function fmtSgn(n: number, d = 0) {
  const s = fmt(Math.abs(n), d);
  return n > 0 ? "+" + s : n < 0 ? "-" + s : s;
}
function fmtPct(n: number) {
  const s = Math.abs(n).toFixed(2) + "%";
  return n > 0 ? "+" + s : n < 0 ? "-" + s : s;
}
function key(m: string, s: string) { return `${m}:${s}`; }
function pnlColor(n: number) { return n >= 0 ? "text-emerald-300" : "text-rose-300"; }

function StatCard({
  label, value, sub, colored,
}: {
  label: string; value: string; sub?: string; colored?: boolean;
}) {
  const isNeg = value.startsWith("-");
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur sm:p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={[
        "mt-1 text-lg font-semibold tabular-nums leading-tight sm:mt-1.5 sm:text-xl",
        colored ? (isNeg ? "text-rose-300" : "text-emerald-300") : "text-white",
      ].join(" ")}>
        {value}
      </div>
      {sub ? (
        <div className={[
          "mt-0.5 text-xs tabular-nums",
          colored ? (isNeg ? "text-rose-300/80" : "text-emerald-300/80") : "text-zinc-500",
        ].join(" ")}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; view?: string }>;
}) {
  const { market, view } = await searchParams;
  const marketFilter: "TW" | "US" = market === "US" ? "US" : "TW";
  const viewFilter: "held" | "realized" = view === "realized" ? "realized" : "held";

  const supabase = await createClient();
  const user = await getUser();


  const [usdtwd, { data: tradesRaw }, { data: quotesRaw }] = await Promise.all([
    fetchUSDTWD(),
    supabase
      .from("stock_trades")
      .select("market,symbol,name,side,quantity,price,fee,tax,currency,trade_date,fx_rate")
      .eq("user_id", user?.id ?? "")
      .order("trade_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("stock_quotes")
      .select("market,symbol,quote_date,close,prev_close,currency")
      .eq("user_id", user?.id ?? "")
      .order("quote_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const trades: Trade[] = (tradesRaw ?? []).map((t) => ({
    market: t.market as "TW" | "US",
    symbol: t.symbol,
    name: t.name ?? null,
    side: t.side as "BUY" | "SELL",
    quantity: Number(t.quantity ?? 0),
    price: Number(t.price ?? 0),
    fee: Number(t.fee ?? 0),
    tax: Number(t.tax ?? 0),
    currency: String(t.currency ?? ""),
    trade_date: t.trade_date,
    fx_rate: t.fx_rate != null ? Number(t.fx_rate) : null,
  }));

  // Whether any US trades are missing fx_rate (need backfill)
  const needsBackfill = trades.some((t) => t.market === "US" && t.fx_rate == null);

  // Latest + 2nd quote per symbol
  // prev_close from DB (stored during realtime sync) takes priority;
  // 2nd stored quote used as fallback so off-hours still shows change
  const latestQuote = new Map<string, Quote>();
  const prevQuote = new Map<string, Quote>();
  for (const q of (quotesRaw ?? []) as Quote[]) {
    const k = key(q.market, q.symbol);
    if (!latestQuote.has(k)) {
      latestQuote.set(k, {
        market: q.market, symbol: q.symbol, quote_date: q.quote_date,
        close: Number(q.close ?? 0),
        prev_close: q.prev_close != null ? Number(q.prev_close) : null,
        currency: String(q.currency ?? ""),
      });
    } else if (!prevQuote.has(k)) {
      prevQuote.set(k, {
        market: q.market, symbol: q.symbol, quote_date: q.quote_date,
        close: Number(q.close ?? 0),
        prev_close: null,
        currency: String(q.currency ?? ""),
      });
    }
  }

  // TW: weighted average cost | US: FIFO
  const pos = computePositions(trades);

  const allRows = Array.from(pos.values()).filter(
    (p) => p.quantity !== 0 || p.realizedPnl !== 0
  );

  // Stats
  type Stats = {
    marketValue: number; cost: number; unrealized: number; unrealizedPct: number;
    realized: number; realizedCost: number; realizedPct: number; realizedCount: number;
    todayPnl: number; todayPct: number; hasTodayPnl: boolean;
  };
  const emptyStats = (): Stats => ({
    marketValue: 0, cost: 0, unrealized: 0, unrealizedPct: 0,
    realized: 0, realizedCost: 0, realizedPct: 0, realizedCount: 0,
    todayPnl: 0, todayPct: 0, hasTodayPnl: false,
  });
  const tw = emptyStats(), us = emptyStats();

  for (const p of allRows) {
    const isUS = p.market === "US";
    const fx = isUS ? usdtwd : 1;
    const s = isUS ? us : tw;
    const q = latestQuote.get(key(p.market, p.symbol));

    if (p.quantity > 0) {
      const mvTWD = q ? q.close * p.quantity * fx : 0;
      if (isUS && p.costBasisTWD > 0) {
        // Use historical TWD cost basis for accurate FX-adjusted P&L
        s.cost += p.costBasisTWD;
        if (q) {
          s.marketValue += mvTWD;
          s.unrealized += mvTWD - p.costBasisTWD;
        }
      } else {
        s.cost += p.avgCost * p.quantity * fx;
        if (q) {
          s.marketValue += mvTWD;
          s.unrealized += (q.close - p.avgCost) * p.quantity * fx;
        }
      }
      if (q) {
        const refClose = q.prev_close ?? prevQuote.get(key(p.market, p.symbol))?.close ?? null;
        if (refClose != null && refClose > 0) {
          s.todayPnl += (q.close - refClose) * p.quantity * fx;
          s.hasTodayPnl = true;
        }
      }
    }
    if (p.realizedPnl !== 0 || p.realizedCost > 0) {
      if (isUS && p.realizedCostTWD > 0) {
        s.realized += p.realizedPnlTWD;
        s.realizedCost += p.realizedCostTWD;
      } else {
        s.realized += p.realizedPnl * fx;
        s.realizedCost += p.realizedCost * fx;
      }
      if (p.quantity === 0) s.realizedCount++;
    }
  }
  // Compute pct after loop
  for (const s of [tw, us]) {
    s.unrealizedPct = s.cost > 0 ? (s.unrealized / s.cost) * 100 : 0;
    s.realizedPct = s.realizedCost > 0 ? (s.realized / s.realizedCost) * 100 : 0;
    const prevMv = s.marketValue - s.todayPnl;
    s.todayPct = prevMv > 0 ? (s.todayPnl / prevMv) * 100 : 0;
  }

  // Chart data
  const allQuotesAsc = (quotesRaw ?? []).slice().reverse().map((q) => ({
    market: q.market as "TW" | "US", symbol: q.symbol,
    quote_date: q.quote_date as string, close: Number(q.close ?? 0),
  }));
  const quotesByKey = new Map<string, { quote_date: string; close: number }[]>();
  for (const q of allQuotesAsc) {
    const k = key(q.market, q.symbol);
    const arr = quotesByKey.get(k) ?? [];
    arr.push({ quote_date: q.quote_date, close: q.close });
    quotesByKey.set(k, arr);
  }
  function getQuoteOnOrBefore(k: string, date: string) {
    const arr = quotesByKey.get(k);
    if (!arr) return null;
    let result: { close: number } | null = null;
    for (const q of arr) { if (q.quote_date <= date) result = q; else break; }
    return result;
  }
  const marketQuoteDates = [...new Set(
    allQuotesAsc.filter((q) => q.market === marketFilter).map((q) => q.quote_date)
  )].sort();
  const rollingQty = new Map<string, number>();
  let rollingNetInvested = 0;
  let tradeIdx = 0;
  const fxLine = marketFilter === "US" ? usdtwd : 1;
  // P&L = current market value − net cash invested (buys − sell proceeds), all in TWD
  const pnlLine = marketQuoteDates.map((date) => {
    while (tradeIdx < trades.length && trades[tradeIdx].trade_date <= date) {
      const t = trades[tradeIdx];
      if (t.market === marketFilter) {
        const k = key(t.market, t.symbol);
        const tradeFx = marketFilter === "US" && t.fx_rate != null ? t.fx_rate : fxLine;
        if (t.side === "BUY") {
          rollingQty.set(k, (rollingQty.get(k) ?? 0) + t.quantity);
          rollingNetInvested += (t.quantity * t.price + t.fee + t.tax) * tradeFx;
        } else {
          rollingQty.set(k, (rollingQty.get(k) ?? 0) - t.quantity);
          rollingNetInvested -= (t.quantity * t.price - t.fee - t.tax) * tradeFx;
        }
      }
      tradeIdx++;
    }
    let marketValue = 0;
    for (const [k, qty] of rollingQty) {
      if (qty <= 0) continue;
      const q = getQuoteOnOrBefore(k, date);
      if (q) marketValue += qty * q.close * fxLine;
    }
    return { date, value: Math.round(marketValue - rollingNetInvested) };
  });
  const chartLabel = (p: { market: string; symbol: string; name: string | null }) =>
    p.market === "TW" ? (p.name ?? p.symbol) : p.symbol;

  const pie = allRows.filter((p) => p.market === marketFilter && p.quantity > 0)
    .flatMap((p) => {
      const q = latestQuote.get(key(p.market, p.symbol));
      return q ? [{ name: chartLabel(p), value: Math.round(q.close * p.quantity) }] : [];
    }).sort((a, b) => b.value - a.value);
  // Per-stock P&L line: walk historical quotes + FIFO running avg for each stock
  const stockPnlLines = allRows
    .filter((p) => p.market === marketFilter && p.quantity > 0)
    .flatMap((p) => {
      const k = key(p.market, p.symbol);
      const stockQuotes = quotesByKey.get(k) ?? [];
      const { trades } = p;
      if (trades.length === 0 || stockQuotes.length === 0) return [];
      const firstDate = trades[0].trade_date;
      let ti = 0, curQty = 0, curAvg = 0;
      const line: { date: string; value: number; pct: number }[] = [];
      for (const q of stockQuotes) {
        if (q.quote_date < firstDate) continue;
        while (ti < trades.length && trades[ti].trade_date <= q.quote_date) {
          curQty = trades[ti].runningQty;
          curAvg = trades[ti].runningAvg;
          ti++;
        }
        if (curQty <= 0) continue;
        const pct = curAvg > 0 ? Math.round(((q.close - curAvg) / curAvg) * 10000) / 100 : 0;
        line.push({ date: q.quote_date, value: Math.round((q.close - curAvg) * curQty), pct });
      }
      return line.length > 0 ? [{ symbol: p.symbol, name: p.name, line }] : [];
    });

  const returnBar = allRows.filter((p) => p.market === marketFilter && p.quantity > 0 && p.avgCost > 0)
    .flatMap((p) => {
      const q = latestQuote.get(key(p.market, p.symbol));
      if (!q) return [];
      const cost = p.avgCost * p.quantity;
      const pct = Math.round(((q.close * p.quantity - cost) / cost) * 10000) / 100;
      return [{ symbol: chartLabel(p), pct }];
    }).sort((a, b) => b.pct - a.pct);
  const marketChartData: MarketChartData = { pie, stockPnlLines, pnlLine, returnBar };

  const stockLines = allRows
    .filter((p) => p.market === marketFilter)
    .flatMap((p) => {
      const k = key(p.market, p.symbol);
      const stockQuotes = quotesByKey.get(k) ?? [];
      const { trades } = p;
      if (trades.length === 0 || stockQuotes.length === 0) return [];
      const fx = p.market === "US" ? usdtwd : 1;
      const firstDate = trades[0].trade_date;
      let ti = 0, curQty = 0, curAvg = 0, curRealized = 0, curRealizedCost = 0;
      const line: { date: string; unrealized: number; realized: number; pct_unrealized: number; pct_realized: number; pct_combined: number }[] = [];
      for (const q of stockQuotes) {
        if (q.quote_date < firstDate) continue;
        while (ti < trades.length && trades[ti].trade_date <= q.quote_date) {
          const t = trades[ti];
          if (t.realizedPnl != null) {
            curRealizedCost += t.quantity * curAvg * fx;
            curRealized += t.realizedPnl;
          }
          curQty = t.runningQty;
          curAvg = t.runningAvg;
          ti++;
        }
        if (curQty <= 0 && curRealized === 0) continue;
        const unrealized = curQty > 0 && curAvg > 0 ? (q.close - curAvg) * curQty * fx : 0;
        const realizedTWD = curRealized * fx;
        const unrealizedCost = curAvg * curQty * fx;
        const pct_unrealized = unrealizedCost > 0 ? Math.round((unrealized / unrealizedCost) * 10000) / 100 : 0;
        const pct_realized = curRealizedCost > 0 ? Math.round((realizedTWD / curRealizedCost) * 10000) / 100 : 0;
        const totalCost = unrealizedCost + curRealizedCost;
        const pct_combined = totalCost > 0 ? Math.round(((unrealized + realizedTWD) / totalCost) * 10000) / 100 : 0;
        line.push({ date: q.quote_date, unrealized: Math.round(unrealized), realized: Math.round(realizedTWD), pct_unrealized, pct_realized, pct_combined });
      }
      return line.length > 0 ? [{ symbol: p.symbol, name: p.name, line }] : [];
    });

  // Trigger background quote sync — always sync if any held position has no quote for today,
  // otherwise respect the throttle threshold to avoid hammering the API.
  const todayTW = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  const hasMissingQuote = allRows.some((p) => {
    if (p.quantity <= 0) return false;
    const q = latestQuote.get(key(p.market, p.symbol));
    return !q || q.quote_date < todayTW;
  });
  after(async () => {
    try {
      const bg = await createClient();
      const bgUser = await getUser();
      if (!bgUser) return;
      if (hasMissingQuote) {
        await syncQuotesForUser();
        return;
      }
      const { data: recent } = await bg
        .from("stock_quotes").select("created_at").eq("user_id", bgUser.id)
        .order("created_at", { ascending: false }).limit(1);
      const lastMs = recent?.[0]?.created_at
        ? Date.now() - new Date(recent[0].created_at).getTime() : Infinity;
      const threshold = isMarketHours() ? 2 * 60_000 : 8 * 3600_000;
      if (lastMs > threshold) await syncQuotesForUser();
    } catch {}
  });

  // Display rows
  const heldRows = allRows.filter((p) => p.market === marketFilter && p.quantity > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  const realizedRows = allRows.filter((p) => p.market === marketFilter && (p.realizedPnl !== 0 || p.quantity < 0))
    .sort((a, b) => b.realizedPnl - a.realizedPnl);

  function toStockPosition(p: typeof allRows[number]): StockPosition {
    const q = latestQuote.get(key(p.market, p.symbol));
    const currentPrice = q?.close ?? null;
    const unrealized = currentPrice != null && p.quantity > 0
      ? (currentPrice - p.avgCost) * p.quantity : null;
    const unrealizedPct = unrealized != null && p.avgCost > 0
      ? (unrealized / (p.avgCost * p.quantity)) * 100 : null;
    const unrealizedTWD = p.market === "US" && unrealized != null
      ? p.costBasisTWD > 0
        ? currentPrice! * usdtwd * p.quantity - p.costBasisTWD
        : unrealized * usdtwd
      : null;
    return {
      symbol: p.symbol, name: p.name, currency: p.currency,
      trades: p.trades,
      finalQty: p.quantity, finalAvg: p.avgCost, realizedPnl: p.realizedPnl,
      realizedCost: p.realizedCost,
      realizedPnlTWD: p.market === "US" && p.realizedCostTWD > 0 ? p.realizedPnlTWD : null,
      currentPrice, unrealized, unrealizedTWD, unrealizedPct,
    };
  }
  const realizedHeld = realizedRows.filter((p) => p.quantity > 0).map(toStockPosition);
  const realizedClosed = realizedRows.filter((p) => p.quantity <= 0).map(toStockPosition);

  const s = marketFilter === "TW" ? tw : us;
  const marketColor = marketFilter === "TW" ? "text-sky-300" : "text-emerald-300";
  const marketLabel = marketFilter === "TW" ? "台股" : "美股";

  return (
    <div className="space-y-6">
      <MarketHoursRefresh intervalMs={30000} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-white">股票記帳</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={syncLatestQuotes}>
            <SyncQuotesButton />
          </form>
          {needsBackfill && <BackfillFxButton />}
          <Link href="/stocks/cost"
            className="rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-sm font-medium text-cyan-300/80 hover:bg-cyan-400/10 transition-colors">
            持倉成本
          </Link>
          <div className="hidden h-5 w-px bg-white/15 sm:block" />
          <Link href="/stocks/trades"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors">
            交易列表
          </Link>
          <Link href="/stocks/trades/new"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            新增交易
          </Link>
        </div>
      </div>

      {/* Market tabs */}
      <div className="flex gap-2 text-sm">
        {(["TW", "US"] as const).map((m) => (
          <Link key={m} href={`/stocks/positions?market=${m}&view=${viewFilter}`}
            className={["rounded-xl px-3 py-2 font-medium transition-colors",
              marketFilter === m
                ? m === "TW" ? "border border-sky-400/30 bg-sky-500/20 text-sky-200"
                             : "border border-emerald-400/30 bg-emerald-500/20 text-emerald-200"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
            ].join(" ")}>
            {m === "TW" ? "台股" : "美股"}
          </Link>
        ))}
      </div>

      {/* Stats — 3 cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${marketColor}`}>{marketLabel}</span>
          {marketFilter === "US" && (
            <span className="text-xs text-zinc-500">USD/TWD ≈ {fmt(usdtwd, 2)}</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <StatCard
            label="今日損益"
            value={s.hasTodayPnl ? fmtSgn(s.todayPnl) : "-"}
            sub={s.hasTodayPnl ? fmtPct(s.todayPct) : "需≥2筆股價"}
            colored={s.hasTodayPnl}
          />
          <StatCard
            label={viewFilter === "held" ? "未實現損益" : "已實現損益"}
            value={viewFilter === "held" ? fmtSgn(s.unrealized) : fmtSgn(s.realized)}
            sub={viewFilter === "held"
              ? fmtPct(s.unrealizedPct)
              : fmtPct(s.realizedPct)}
            colored
          />
          <StatCard
            label={viewFilter === "held" ? "股票市值" : "總投入成本"}
            value={viewFilter === "held" ? fmt(s.marketValue) : fmt(s.realizedCost)}
            sub={viewFilter === "held" ? `成本 ${fmt(s.cost)}` : `${s.realizedCount} 筆已實現`}
          />
        </div>
      </div>

      {/* Sub-tabs: 持有中 / 已實現 */}
      <div className="flex gap-2 text-sm">
        <Link href={`/stocks/positions?market=${marketFilter}&view=held`}
          className={["rounded-xl px-3 py-2 font-medium transition-colors",
            viewFilter === "held"
              ? "border border-white/20 bg-white/10 text-white"
              : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10",
          ].join(" ")}>
          持有中 <span className="ml-1 text-xs opacity-70">{heldRows.length}</span>
        </Link>
        <Link href={`/stocks/positions?market=${marketFilter}&view=realized`}
          className={["rounded-xl px-3 py-2 font-medium transition-colors",
            viewFilter === "realized"
              ? "border border-white/20 bg-white/10 text-white"
              : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10",
          ].join(" ")}>
          已實現 <span className="ml-1 text-xs opacity-70">{realizedRows.length}</span>
        </Link>
      </div>

      {/* ── HELD positions table ── */}
      {viewFilter === "held" && (
        <div className="-mx-4 overflow-auto border-y border-white/10 bg-black/30 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-0">
          <table className="w-full min-w-[530px] text-left text-sm">
              <thead className="sticky top-0 bg-black/40 text-xs text-zinc-300">
                <tr>
                  <th className="px-3 py-2 font-medium">股票</th>
                  <th className="px-3 py-2 font-medium text-right">股價 / 漲跌</th>
                  <th className="px-3 py-2 font-medium text-right">今日損益</th>
                  <th className="px-3 py-2 font-medium text-right">損益 / 報酬率</th>
                  <th className="px-3 py-2 font-medium text-right">均價</th>
                  <th className="px-3 py-2 font-medium text-right">股數</th>
                  <th className="px-3 py-2 font-medium text-right">市值/成本</th>
                </tr>
              </thead>
              <tbody>
                {heldRows.map((p) => {
                  const isUS = p.market === "US";
                  const q = latestQuote.get(key(p.market, p.symbol));
                  const close = q?.close ?? null;
                  const unrealized = close != null ? (close - p.avgCost) * p.quantity : null;
                  const returnPct = close != null && p.avgCost > 0
                    ? ((close - p.avgCost) / p.avgCost) * 100 : null;
                  // TWD unrealized: use historical cost basis when available, else current rate
                  const unrealizedTWD = isUS && close != null
                    ? p.costBasisTWD > 0
                      ? close * usdtwd * p.quantity - p.costBasisTWD
                      : unrealized! * usdtwd
                    : null;
                  const prevClose = q?.prev_close ?? prevQuote.get(key(p.market, p.symbol))?.close ?? null;
                  const dayChg = close != null && prevClose != null && prevClose > 0
                    ? close - prevClose : null;
                  const dayChgPct = dayChg != null && prevClose! > 0
                    ? (dayChg / prevClose!) * 100 : null;
                  const todayPnl = dayChg != null ? dayChg * p.quantity : null;
                  return (
                    <tr key={key(p.market, p.symbol)}
                      className="border-t border-white/5 hover:bg-white/[0.02]">
                      {/* 股票 */}
                      <td className="px-3 py-2 font-medium text-white">
                        {p.market === "TW" ? (
                          <>
                            <div className={p.name && p.name.length > 4 ? "whitespace-normal" : "whitespace-nowrap"}>
                              {p.name ?? p.symbol}
                            </div>
                            {p.name && <div className="hidden text-xs font-normal text-zinc-500 sm:block">{p.symbol}</div>}
                          </>
                        ) : (
                          <>
                            <div className="whitespace-nowrap">{p.symbol}</div>
                            {p.name && <div className="hidden whitespace-nowrap text-xs font-normal text-zinc-500 sm:block">{p.name}</div>}
                          </>
                        )}
                      </td>
                      {/* 股價 / 漲跌 */}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {close == null ? (
                          <span className="text-zinc-500">-</span>
                        ) : (
                          <>
                            <div className="whitespace-nowrap font-semibold">{fmt(close, 2)} {q?.currency}</div>
                            {dayChg != null && dayChgPct != null && (
                              <div className={["whitespace-nowrap text-xs", pnlColor(dayChg)].join(" ")}>
                                {fmtSgn(dayChg, 2)} ({fmtPct(dayChgPct)})
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      {/* 今日損益 */}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {todayPnl == null ? (
                          <span className="text-zinc-500">-</span>
                        ) : (
                          <>
                            <div className={[pnlColor(todayPnl), "whitespace-nowrap font-semibold"].join(" ")}>
                              {fmtSgn(todayPnl, isUS ? 2 : 0)} {p.currency}
                            </div>
                            {isUS && (
                              <div className="whitespace-nowrap text-xs text-zinc-400">
                                ≈ {fmtSgn(todayPnl! * usdtwd, 0)} TWD
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      {/* 損益 / 報酬率 */}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {unrealized == null ? (
                          <span className="whitespace-nowrap text-zinc-500">需股價</span>
                        ) : (
                          <>
                            <div className={[pnlColor(unrealized), "whitespace-nowrap font-semibold"].join(" ")}>
                              {fmtSgn(unrealized, isUS ? 2 : 0)} {p.currency}
                            </div>
                            {returnPct != null && (
                              <div className={["whitespace-nowrap text-xs", pnlColor(returnPct)].join(" ")}>
                                {fmtPct(returnPct)}
                              </div>
                            )}
                            {isUS && unrealizedTWD != null && (
                              <div className="whitespace-nowrap text-xs text-zinc-400">
                                ≈ {fmtSgn(unrealizedTWD, 0)} TWD
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      {/* 均價 */}
                      <td className="px-3 py-2 text-right tabular-nums">
                        <div className="whitespace-nowrap text-zinc-400">{fmt(p.avgCost, 2)} {p.currency}</div>
                      </td>
                      {/* 股數 */}
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                        {fmt(p.quantity, 4)}
                      </td>
                      {/* 市值/成本 */}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {close != null ? (() => {
                          if (isUS) {
                            const mvUSD = close * p.quantity;
                            const costUSD = p.avgCost * p.quantity;
                            const mvTWD = Math.round(mvUSD * usdtwd);
                            const costTWD = Math.round(p.costBasisTWD > 0 ? p.costBasisTWD : costUSD * usdtwd);
                            return (
                              <>
                                <div className="whitespace-nowrap text-zinc-200">{fmt(mvUSD, 2)} / {fmt(costUSD, 2)} <span className="text-xs text-zinc-500">USD</span></div>
                                <div className="whitespace-nowrap text-xs text-zinc-600">≈ {fmt(mvTWD)} / {fmt(costTWD)} TWD</div>
                              </>
                            );
                          }
                          const mv = Math.round(close * p.quantity);
                          const cost = Math.round(p.avgCost * p.quantity);
                          return (
                            <>
                              <div className="whitespace-nowrap text-zinc-200">{fmt(mv)}</div>
                              <div className="whitespace-nowrap text-xs text-zinc-500">/ {fmt(cost)}</div>
                            </>
                          );
                        })() : <span className="text-zinc-500">-</span>}
                      </td>
                    </tr>
                  );
                })}
                {heldRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-10 text-center text-sm text-zinc-400" colSpan={7}>
                      目前無持倉。去{" "}
                      <Link href="/stocks/trades/new" className="font-medium underline">
                        新增交易
                      </Link>
                      。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      )}

      {/* ── REALIZED positions accordion ── */}
      {viewFilter === "realized" && (
        realizedRows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-sm text-zinc-500">
            尚無已實現損益紀錄。
          </div>
        ) : (
          <StockCostAccordion heldPositions={realizedHeld} closedPositions={realizedClosed} />
        )
      )}

      {/* Charts */}
      {viewFilter === "realized" ? (
        <PnlSummaryChart stockLines={stockLines} />
      ) : (
        <MarketChartsPanel data={marketChartData} market={marketFilter} />
      )}
    </div>
  );
}
