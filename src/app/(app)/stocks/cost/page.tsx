import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { computePositions, type ComputedPosition } from "@/lib/position-calc";
import { StockCostAccordion, type StockPosition } from "@/components/StockCostAccordion";
import { BackfillFxButton } from "@/components/BackfillFxButton";

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;
  const marketFilter: "TW" | "US" = market === "US" ? "US" : "TW";

  const supabase = await createClient();
  const user = await getUser();

  const [{ data: tradesRaw }, { data: quotesRaw }] = await Promise.all([
    supabase
      .from("stock_trades")
      .select("id,market,symbol,name,side,quantity,price,fee,tax,currency,trade_date,fx_rate")
      .eq("user_id", user?.id ?? "")
      .eq("market", marketFilter)
      .order("trade_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("stock_quotes")
      .select("market,symbol,close")
      .eq("user_id", user?.id ?? "")
      .eq("market", marketFilter)
      .order("quote_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const needsBackfill = marketFilter === "US" &&
    (tradesRaw ?? []).some((t) => t.fx_rate == null);

  const latestClose = new Map<string, number>();
  for (const q of quotesRaw ?? []) {
    const k = `${q.market}:${q.symbol}`;
    if (!latestClose.has(k)) latestClose.set(k, Number(q.close));
  }

  // TW: weighted average cost | US: FIFO
  const posMap = computePositions(
    (tradesRaw ?? []).map((t) => ({
      market: t.market as "TW" | "US",
      symbol: t.symbol, name: t.name ?? null,
      side: t.side as "BUY" | "SELL",
      quantity: Number(t.quantity), price: Number(t.price),
      fee: Number(t.fee ?? 0), tax: Number(t.tax ?? 0),
      currency: t.currency, trade_date: t.trade_date,
      fx_rate: t.fx_rate != null ? Number(t.fx_rate) : null,
    }))
  );

  function toPosition(s: ComputedPosition): StockPosition {
    const k = `${marketFilter}:${s.symbol}`;
    const currentPrice = latestClose.get(k) ?? null;
    const unrealized = currentPrice != null && s.quantity > 0
      ? (currentPrice - s.avgCost) * s.quantity : null;
    const unrealizedPct = unrealized != null && s.avgCost > 0
      ? (unrealized / (s.avgCost * s.quantity)) * 100 : null;
    return {
      symbol: s.symbol, name: s.name, currency: s.currency,
      trades: s.trades,
      finalQty: s.quantity, finalAvg: s.avgCost, realizedPnl: s.realizedPnl,
      realizedPnlTWD: marketFilter === "US" && s.realizedCostTWD > 0 ? s.realizedPnlTWD : null,
      currentPrice, unrealized, unrealizedPct,
    };
  }

  const all = Array.from(posMap.values());
  const heldPositions = all
    .filter((s) => s.quantity > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map(toPosition);
  const closedPositions = all
    .filter((s) => s.quantity <= 0 && s.trades.length > 0)
    .sort((a, b) => b.realizedPnl - a.realizedPnl)
    .map(toPosition);

  const tabClass = (active: boolean) =>
    [
      "rounded-xl px-3 py-2 text-sm font-medium",
      active
        ? "bg-white/10 text-white border border-white/15"
        : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10",
    ].join(" ");

  const isEmpty = heldPositions.length === 0 && closedPositions.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">持倉成本</h1>
          <p className="mt-1 text-sm text-zinc-300">各股買賣紀錄與均攤成本計算過程。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {needsBackfill && <BackfillFxButton />}
          <Link
            href="/stocks"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
          >
            返回
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href="/stocks/cost" className={tabClass(marketFilter === "TW")}>台股</Link>
        <Link href="/stocks/cost?market=US" className={tabClass(marketFilter === "US")}>美股</Link>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-sm text-zinc-500">
          尚無{marketFilter === "TW" ? "台股" : "美股"}交易紀錄。
        </div>
      ) : (
        <StockCostAccordion heldPositions={heldPositions} closedPositions={closedPositions} />
      )}
    </div>
  );
}
