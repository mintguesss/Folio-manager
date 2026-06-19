export type TradeInput = {
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
  fx_rate?: number | null; // USD/TWD at trade time (US only)
};

export type ComputedTrade = {
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
  realizedPnlTWD: number | null; // only set for US SELL trades with fx_rate
};

export type ComputedPosition = {
  market: "TW" | "US";
  symbol: string;
  name: string | null;
  currency: string;
  quantity: number;
  avgCost: number;
  realizedPnl: number;
  realizedCost: number;
  trades: ComputedTrade[];
  // TWD cost basis (US only; 0 when fx_rate was unavailable at trade time)
  costBasisTWD: number;
  realizedPnlTWD: number;
  realizedCostTWD: number;
};

type Lot = { quantity: number; costPerShare: number; costPerShareTWD: number };

/**
 * Both TW and US stocks use FIFO (first-in, first-out).
 * For US stocks, fx_rate (USD/TWD at trade time) is used to track the TWD
 * cost basis separately, enabling accurate TWD P&L calculations.
 *
 * Trades must be sorted by trade_date asc, then created_at asc.
 */
export function computePositions(trades: TradeInput[]): Map<string, ComputedPosition> {
  const posMap = new Map<string, ComputedPosition>();
  const lotsMap = new Map<string, Lot[]>();
  let idx = 0;

  for (const t of trades) {
    const k = `${t.market}:${t.symbol}`;
    const pos: ComputedPosition = posMap.get(k) ?? {
      market: t.market, symbol: t.symbol, name: t.name,
      currency: t.currency, quantity: 0, avgCost: 0,
      realizedPnl: 0, realizedCost: 0, trades: [],
      costBasisTWD: 0, realizedPnlTWD: 0, realizedCostTWD: 0,
    };
    pos.name = t.name ?? pos.name;
    pos.currency = t.currency;

    const { quantity: qty, price, fee, tax } = t;
    const fxRate = t.market === "US" && t.fx_rate != null && t.fx_rate > 0 ? t.fx_rate : 0;
    let realizedPnl: number | null = null;
    let tradePnlTWD: number | null = null;

    if (t.side === "BUY") {
      const tradeCost = qty * price + fee + tax;
      const lots = lotsMap.get(k) ?? [];
      const costPerShareTWD = fxRate > 0 ? (tradeCost * fxRate) / qty : 0;
      lots.push({ quantity: qty, costPerShare: tradeCost / qty, costPerShareTWD });
      lotsMap.set(k, lots);
      const totalQty = lots.reduce((s, l) => s + l.quantity, 0);
      const totalCost = lots.reduce((s, l) => s + l.quantity * l.costPerShare, 0);
      pos.quantity = totalQty;
      pos.avgCost = totalQty > 0 ? totalCost / totalQty : 0;
      pos.costBasisTWD = lots.reduce((s, l) => s + l.quantity * l.costPerShareTWD, 0);
    } else {
      // SELL: FIFO for both TW and US
      const lots = lotsMap.get(k) ?? [];
      let remaining = qty;
      let costBasis = 0;
      let costBasisTWD = 0;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const taken = Math.min(remaining, lot.quantity);
        costBasis += taken * lot.costPerShare;
        costBasisTWD += taken * lot.costPerShareTWD;
        lot.quantity -= taken;
        remaining -= taken;
        if (lot.quantity === 0) lots.shift();
      }
      lotsMap.set(k, lots);

      const proceeds = qty * price - fee - tax;
      realizedPnl = proceeds - costBasis;
      pos.realizedPnl += realizedPnl;
      pos.realizedCost += costBasis;
      pos.quantity -= qty;

      // TWD realized tracking (US only — fxRate is 0 for TW)
      const proceedsTWD = fxRate > 0 ? proceeds * fxRate : 0;
      const realizedPnlTWD = proceedsTWD > 0 || costBasisTWD > 0
        ? proceedsTWD - costBasisTWD : 0;
      tradePnlTWD = fxRate > 0 ? realizedPnlTWD : null;
      pos.realizedPnlTWD += realizedPnlTWD;
      pos.realizedCostTWD += costBasisTWD;

      // Recompute avgCost and costBasisTWD from remaining lots
      const totalQty = lots.reduce((s, l) => s + l.quantity, 0);
      const totalCost = lots.reduce((s, l) => s + l.quantity * l.costPerShare, 0);
      pos.avgCost = totalQty > 0 ? totalCost / totalQty : 0;
      pos.costBasisTWD = lots.reduce((s, l) => s + l.quantity * l.costPerShareTWD, 0);
    }

    pos.trades.push({
      index: idx++,
      trade_date: t.trade_date,
      side: t.side,
      quantity: qty, price, fee, tax,
      runningQty: pos.quantity,
      runningAvg: pos.avgCost,
      realizedPnl,
      realizedPnlTWD: tradePnlTWD,
    });

    posMap.set(k, pos);
  }

  return posMap;
}
