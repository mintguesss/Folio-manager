import { NextRequest, NextResponse } from "next/server";

type StockResult = { symbol: string; name: string };

async function searchTW(q: string): Promise<StockResult[]> {
  try {
    // TSE listed + OTC listed companies, cached 24h
    const [r1, r2] = await Promise.allSettled([
      fetch("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL", {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
      fetch("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes", {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
    ]);

    const all: StockResult[] = [];

    for (const r of [r1, r2]) {
      if (r.status !== "fulfilled" || !r.value.ok) continue;
      const arr: Record<string, string>[] = await r.value.json();
      for (const item of arr) {
        // TWSE uses Code/Name, TPEX uses 代號/名稱 or similar
        const symbol = (
          item["Code"] ?? item["代號"] ?? item["股票代號"] ?? item["公司代號"] ?? ""
        ).toString().trim();
        const name = (
          item["Name"] ?? item["名稱"] ?? item["股票名稱"] ?? item["公司名稱"] ?? ""
        ).toString().trim();
        if (symbol && name && /^\d/.test(symbol)) all.push({ symbol, name });
      }
    }

    if (all.length === 0) return [];

    const filtered = all.filter(
      (c) => c.symbol.startsWith(q) || c.name.includes(q)
    );
    return filtered.slice(0, 10);
  } catch {
    return [];
  }
}

async function searchUS(q: string): Promise<StockResult[]> {
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=US&quotesCount=8&newsCount=0&enableFuzzyQuery=true`;
      const resp = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const quotes: Record<string, string>[] = data?.quotes ?? [];
      return quotes
        .filter((item) => item.quoteType === "EQUITY" || item.quoteType === "ETF")
        .map((item) => ({
          symbol: String(item.symbol ?? ""),
          name: String(item.shortname ?? item.longname ?? ""),
        }))
        .filter((item) => item.symbol)
        .slice(0, 8);
    } catch {}
  }
  return [];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const market = req.nextUrl.searchParams.get("market") ?? "TW";

  if (q.length < 1) return NextResponse.json({ results: [] });

  const results = market === "TW" ? await searchTW(q) : await searchUS(q);
  return NextResponse.json({ results });
}
