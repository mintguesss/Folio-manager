import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchClose } from "@/lib/stock-utils";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: trades } = await supabase
    .from("stock_trades")
    .select("user_id, market, symbol");

  if (!trades?.length) return NextResponse.json({ synced: 0, failed: [] });

  // One fetch per unique market:symbol, then upsert for each user who holds it
  type Entry = { market: "TW" | "US"; symbol: string; userIds: Set<string> };
  const symbolMap = new Map<string, Entry>();
  for (const t of trades) {
    const k = `${t.market}:${t.symbol}`;
    if (!symbolMap.has(k)) {
      symbolMap.set(k, { market: t.market as "TW" | "US", symbol: t.symbol, userIds: new Set() });
    }
    symbolMap.get(k)!.userIds.add(t.user_id);
  }

  let synced = 0;
  const failed: string[] = [];

  for (const { market, symbol, userIds } of symbolMap.values()) {
    const q = await fetchClose(market, symbol);
    if (!q) { failed.push(`${market}:${symbol}`); continue; }

    const rows = Array.from(userIds).map((userId) => ({
      user_id: userId,
      market,
      symbol,
      quote_date: q.quote_date,
      close: q.close,
      prev_close: q.prev_close,
      currency: market === "TW" ? "TWD" : "USD",
    }));

    const { error } = await supabase
      .from("stock_quotes")
      .upsert(rows, { onConflict: "user_id,market,symbol,quote_date" });

    if (error) { failed.push(`${market}:${symbol}`); continue; }
    synced++;
  }

  return NextResponse.json({ synced, failed, timestamp: new Date().toISOString() });
}
