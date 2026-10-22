import { createClient, getUser } from "@/lib/supabase/server";
import { CURRENCY_INFO, type TravelCurrency } from "@/lib/currency";

type QuoteResult = {
  close: number;
  prev_close: number | null;
  quote_date: string;
  is_realtime: boolean;
} | null;

// Batch-fetch all TW symbols in ONE TWSE request (avoids rate-limiting)
async function fetchFromTWSEBatch(symbols: string[]): Promise<Map<string, NonNullable<QuoteResult>>> {
  if (symbols.length === 0) return new Map();
  // Try both exchanges for every symbol so we don't need to know which exchange each belongs to
  const parts = symbols.flatMap((s) => [`tse_${s}.tw`, `otc_${s}.tw`]);
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${parts.join("|")}&json=1&delay=0`;
  try {
    const resp = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!resp.ok) return new Map();
    const json = await resp.json();
    const results = new Map<string, NonNullable<QuoteResult>>();
    for (const item of json?.msgArray ?? []) {
      const symbol = String(item.c ?? "").toUpperCase();
      if (!symbol || results.has(symbol)) continue; // keep first (TSE preferred over OTC)
      const isRealtime = item.z !== "-" && item.z !== undefined;
      const priceStr = isRealtime ? item.z : item.y;
      const close = Number(priceStr);
      if (!Number.isFinite(close) || close <= 0) continue;
      const prevRaw = isRealtime ? Number(item.y) : NaN;
      let prev_close = Number.isFinite(prevRaw) && prevRaw > 0 ? prevRaw : null;
      const raw = String(item.d ?? "");
      const quote_date =
        raw.length === 8
          ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
          : new Date().toISOString().slice(0, 10);
      // Outside market hours: fallback to Yahoo for prev_close
      if (!isRealtime && prev_close == null) {
        for (const suffix of [".TW", ".TWO"]) {
          const y = await fetchFromYahoo(symbol + suffix).catch(() => null);
          if (y?.prev_close != null) { prev_close = y.prev_close; break; }
        }
      }
      results.set(symbol, { close, prev_close, quote_date, is_realtime: isRealtime });
    }
    return results;
  } catch {
    return new Map();
  }
}

// Single-symbol TWSE fetch (used by fetchClose for individual lookups)
async function fetchFromTWSE(symbol: string): Promise<QuoteResult> {
  const batch = await fetchFromTWSEBatch([symbol]);
  return batch.get(symbol) ?? null;
}

async function fetchFromYahoo(symbol: string): Promise<QuoteResult> {
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const resp = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) continue;
      const close = meta.regularMarketPrice as number;
      if (!Number.isFinite(close) || close <= 0) continue;
      const ts = meta.regularMarketTime as number;
      const quote_date = new Date(ts * 1000).toISOString().slice(0, 10);
      const is_realtime = meta.marketState === "REGULAR";
      const prevRaw = meta.chartPreviousClose as number | undefined;
      const prev_close = Number.isFinite(prevRaw!) && prevRaw! > 0 ? prevRaw! : null;
      return { close, prev_close, quote_date, is_realtime };
    } catch {}
  }
  return null;
}

// FX rate fetch — live=true skips cache, live=false caches 1 hour
async function fetchFXRate(
  symbol: string,
  fallback: number,
  min: number,
  max: number,
  live = false
): Promise<number> {
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const resp = await fetch(url, {
        ...(live ? { cache: "no-store" } : { next: { revalidate: 3600 } }),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) continue;
      const close = meta.regularMarketPrice as number;
      if (Number.isFinite(close) && close > min && close < max) return close;
    } catch {}
  }
  return fallback;
}

export const fetchUSDTWD = () => fetchFXRate("USDTWD=X", 32.0, 20, 60);
export const fetchTravelFx = async (cur: TravelCurrency, live = false) => {
  if (cur === "TWD") return 1;
  const { symbol, fallback, min, max } = CURRENCY_INFO[cur].fx;
  return fetchFXRate(symbol, fallback, min, max, live);
};

export async function fetchUSDTWDForDate(dateStr: string): Promise<number> {
  const ts = Math.floor(new Date(`${dateStr}T04:00:00Z`).getTime() / 1000);
  const tsEnd = ts + 86400;
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/USDTWD=X?interval=1d&period1=${ts}&period2=${tsEnd}`;
      const resp = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      const close = closes.find((c) => Number.isFinite(c) && c > 20 && c < 60);
      if (close) return close;
    } catch {}
  }
  return fetchUSDTWD();
}

export async function fetchTravelFxForDate(cur: TravelCurrency, dateStr: string): Promise<number> {
  if (cur === "TWD") return 1;
  const { symbol, min, max } = CURRENCY_INFO[cur].fx;
  const ts = Math.floor(new Date(`${dateStr}T04:00:00Z`).getTime() / 1000);
  const tsEnd = ts + 86400;
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${ts}&period2=${tsEnd}`;
      const resp = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      const close = closes.find((c) => Number.isFinite(c) && c > min && c < max);
      if (close) return close;
    } catch {}
  }
  return fetchTravelFx(cur);
}

export async function fetchClose(
  market: "TW" | "US",
  symbol: string
): Promise<QuoteResult> {
  if (market === "US") return fetchFromYahoo(symbol);
  // TW: Yahoo first — TWSE realtime API returns yesterday's close after 13:30
  for (const suffix of [".TW", ".TWO"]) {
    const q = await fetchFromYahoo(symbol + suffix).catch(() => null);
    if (q) return q;
  }
  return fetchFromTWSE(symbol);
}

export async function syncQuotesForUser(): Promise<{
  synced: number;
  failed: string[];
}> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { synced: 0, failed: [] };

  const { data: trades } = await supabase
    .from("stock_trades")
    .select("market,symbol")
    .eq("user_id", user.id);

  const pairs = new Map<string, { market: "TW" | "US"; symbol: string }>();
  for (const t of trades ?? []) {
    const market = t.market as "TW" | "US";
    const symbol = String(t.symbol ?? "").toUpperCase();
    if (!symbol) continue;
    pairs.set(`${market}:${symbol}`, { market, symbol });
  }

  const twSymbols = Array.from(pairs.values())
    .filter((p) => p.market === "TW")
    .map((p) => p.symbol);
  const usPairs = Array.from(pairs.values()).filter((p) => p.market === "US");

  const failed: string[] = [];
  let synced = 0;

  // ── TW: Yahoo first (near real-time for TW stocks), TWSE as fallback ──
  const twFetchResults = await Promise.allSettled(
    twSymbols.map(async (sym) => {
      for (const suffix of [".TW", ".TWO"]) {
        const q = await fetchFromYahoo(sym + suffix).catch(() => null);
        if (q) return { sym, q };
      }
      const q = await fetchFromTWSE(sym).catch(() => null);
      if (q) return { sym, q };
      throw new Error(`TW:${sym}`);
    })
  );

  for (const result of twFetchResults) {
    if (result.status === "fulfilled") {
      const { sym, q } = result.value;
      const { error } = await supabase.from("stock_quotes").upsert(
        {
          user_id: user.id,
          market: "TW",
          symbol: sym,
          quote_date: q.quote_date,
          close: q.close,
          prev_close: q.prev_close,
          currency: "TWD",
        },
        { onConflict: "user_id,market,symbol,quote_date" }
      );
      if (error) failed.push(`TW:${sym}`);
      else synced++;
    } else {
      failed.push((result.reason as Error)?.message ?? "TW:unknown");
    }
  }

  // ── US: parallel Yahoo Finance requests ──
  const usResults = await Promise.allSettled(
    usPairs.map(async (p) => {
      const q = await fetchFromYahoo(p.symbol);
      if (!q) throw new Error(`US:${p.symbol}`);
      return { p, q };
    })
  );
  for (const result of usResults) {
    if (result.status === "fulfilled") {
      const { p, q } = result.value;
      const { error } = await supabase.from("stock_quotes").upsert(
        {
          user_id: user.id,
          market: p.market,
          symbol: p.symbol,
          quote_date: q.quote_date,
          close: q.close,
          prev_close: q.prev_close,
          currency: "USD",
        },
        { onConflict: "user_id,market,symbol,quote_date" }
      );
      if (error) failed.push(`US:${p.symbol}`);
      else synced++;
    } else {
      failed.push((result.reason as Error)?.message ?? "US:unknown");
    }
  }

  return { synced, failed };
}
