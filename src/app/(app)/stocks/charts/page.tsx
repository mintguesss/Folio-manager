import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchUSDTWD } from "@/lib/stock-utils";
import { StockChartsPanel, type StockChartData } from "@/components/StockChartsPanel";

type Trade = {
  market: "TW" | "US";
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  currency: string;
  trade_date: string;
};

type RawQuote = {
  market: "TW" | "US";
  symbol: string;
  quote_date: string;
  close: number;
};

function key(m: string, s: string) {
  return `${m}:${s}`;
}

export default async function StockChartsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const usdtwd = await fetchUSDTWD();

  const { data: tradesRaw } = await supabase
    .from("stock_trades")
    .select("market,symbol,side,quantity,price,fee,tax,currency,trade_date")
    .eq("user_id", user?.id ?? "")
    .order("trade_date", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: quotesRaw } = await supabase
    .from("stock_quotes")
    .select("market,symbol,quote_date,close,currency")
    .eq("user_id", user?.id ?? "")
    .order("quote_date", { ascending: true });

  const trades: Trade[] = (tradesRaw ?? []).map((t) => ({
    market: t.market as "TW" | "US",
    symbol: t.symbol,
    side: t.side as "BUY" | "SELL",
    quantity: Number(t.quantity ?? 0),
    price: Number(t.price ?? 0),
    fee: Number(t.fee ?? 0),
    tax: Number(t.tax ?? 0),
    currency: String(t.currency ?? ""),
    trade_date: t.trade_date,
  }));

  const allQuotes: RawQuote[] = (quotesRaw ?? []).map((q) => ({
    market: q.market as "TW" | "US",
    symbol: q.symbol,
    quote_date: q.quote_date,
    close: Number(q.close ?? 0),
  }));

  // Average cost method — compute current positions
  type Position = {
    market: "TW" | "US";
    symbol: string;
    quantity: number;
    avgCost: number;
    realizedPnl: number;
  };

  const posMap = new Map<string, Position>();
  for (const t of trades) {
    const k = key(t.market, t.symbol);
    const p = posMap.get(k) ?? {
      market: t.market,
      symbol: t.symbol,
      quantity: 0,
      avgCost: 0,
      realizedPnl: 0,
    };
    const totalCost = p.quantity * p.avgCost;
    const tradeValue = t.quantity * t.price + t.fee + t.tax;
    if (t.side === "BUY") {
      const newQty = p.quantity + t.quantity;
      posMap.set(k, {
        ...p,
        quantity: newQty,
        avgCost: newQty > 0 ? (totalCost + tradeValue) / newQty : 0,
      });
    } else {
      const proceeds = t.quantity * t.price - t.fee - t.tax;
      posMap.set(k, {
        ...p,
        quantity: p.quantity - t.quantity,
        realizedPnl: p.realizedPnl + (proceeds - t.quantity * p.avgCost),
      });
    }
  }

  // Latest quote per symbol
  const latestQuote = new Map<string, RawQuote>();
  for (const q of allQuotes) {
    const k = key(q.market, q.symbol);
    const existing = latestQuote.get(k);
    if (!existing || q.quote_date >= existing.quote_date) {
      latestQuote.set(k, q);
    }
  }

  // ── Pie: market value by symbol ──
  const pieBySymbol: StockChartData["pieBySymbol"] = [];
  const marketTotals = { TW: 0, US: 0 };

  for (const [k, p] of posMap) {
    if (p.quantity <= 0) continue;
    const q = latestQuote.get(k);
    if (!q) continue;
    const fx = p.market === "US" ? usdtwd : 1;
    const value = q.close * p.quantity * fx;
    pieBySymbol.push({ name: p.symbol, value: Math.round(value) });
    marketTotals[p.market] += value;
  }
  pieBySymbol.sort((a, b) => b.value - a.value);

  const pieByMarket: StockChartData["pieByMarket"] = [
    { name: "台股", value: Math.round(marketTotals.TW) },
    { name: "美股 (換算TWD)", value: Math.round(marketTotals.US) },
  ].filter((d) => d.value > 0);

  // ── Bar: P&L by symbol ──
  const pnlBar: StockChartData["pnlBar"] = [];
  for (const [k, p] of posMap) {
    const q = latestQuote.get(k);
    const fx = p.market === "US" ? usdtwd : 1;
    const unrealized =
      p.quantity > 0 && q ? (q.close - p.avgCost) * p.quantity * fx : 0;
    const realized = p.realizedPnl * fx;
    if (Math.abs(unrealized) > 1 || Math.abs(realized) > 1) {
      pnlBar.push({
        symbol: p.symbol,
        unrealized: Math.round(unrealized),
        realized: Math.round(realized),
      });
    }
  }
  pnlBar.sort(
    (a, b) => b.unrealized + b.realized - (a.unrealized + a.realized)
  );

  // ── Line: portfolio value over time ──
  // Group quotes by symbol sorted ascending for binary-search style lookup
  const quotesBySymbol = new Map<string, RawQuote[]>();
  for (const q of allQuotes) {
    const k = key(q.market, q.symbol);
    const arr = quotesBySymbol.get(k) ?? [];
    arr.push(q);
    quotesBySymbol.set(k, arr);
  }

  function getQuoteOnOrBefore(k: string, date: string): RawQuote | null {
    const arr = quotesBySymbol.get(k);
    if (!arr) return null;
    let result: RawQuote | null = null;
    for (const q of arr) {
      if (q.quote_date <= date) result = q;
      else break;
    }
    return result;
  }

  const quoteDates = [
    ...new Set(allQuotes.map((q) => q.quote_date)),
  ].sort();

  // Rolling positions state — advance forward through sorted trades
  const rollingPos = new Map<string, { market: "TW" | "US"; qty: number }>();
  let tradeIdx = 0;
  const sortedTrades = [...trades].sort((a, b) =>
    a.trade_date.localeCompare(b.trade_date)
  );

  const portfolioLine: StockChartData["portfolioLine"] = quoteDates.map(
    (date) => {
      while (
        tradeIdx < sortedTrades.length &&
        sortedTrades[tradeIdx].trade_date <= date
      ) {
        const t = sortedTrades[tradeIdx];
        const k = key(t.market, t.symbol);
        const p = rollingPos.get(k) ?? { market: t.market, qty: 0 };
        if (t.side === "BUY") p.qty += t.quantity;
        else p.qty -= t.quantity;
        rollingPos.set(k, p);
        tradeIdx++;
      }

      let value = 0;
      for (const [k, p] of rollingPos) {
        if (p.qty <= 0) continue;
        const q = getQuoteOnOrBefore(k, date);
        if (!q) continue;
        const fx = p.market === "US" ? usdtwd : 1;
        value += p.qty * q.close * fx;
      }
      return { date, value: Math.round(value) };
    }
  );

  const chartData: StockChartData = {
    pieBySymbol,
    pieByMarket,
    pnlBar,
    portfolioLine,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">股票圖表</h1>
          <p className="mt-1 text-sm text-zinc-400">
            依報價紀錄估算市值走勢 · USD/TWD ≈ {usdtwd.toFixed(2)}
          </p>
        </div>
        <Link
          href="/stocks/positions"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
        >
          持股損益
        </Link>
      </div>

      <StockChartsPanel data={chartData} />
    </div>
  );
}
