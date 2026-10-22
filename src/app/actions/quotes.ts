"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { z } from "zod";
import { fetchClose, syncQuotesForUser } from "@/lib/stock-utils";

const QuoteSchema = z.object({
  market: z.enum(["TW", "US"]),
  symbol: z.string().min(1).transform((s) => s.trim().toUpperCase()),
  quote_date: z.string().min(8),
  close: z.coerce.number().finite().min(0),
  currency: z.string().min(3).max(8).transform((s) => s.trim().toUpperCase()),
});

export async function upsertQuote(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = QuoteSchema.safeParse({
    market: formData.get("market"),
    symbol: formData.get("symbol"),
    quote_date: formData.get("quote_date"),
    close: formData.get("close"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) return { ok: false as const, message: "輸入格式不正確。" };

  const row = { user_id: user.id, ...parsed.data };
  const { error } = await supabase
    .from("stock_quotes")
    .upsert(row, { onConflict: "user_id,market,symbol,quote_date" });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/stocks");
  revalidatePath("/stocks/positions");
  revalidatePath("/stocks/quotes");
  return { ok: true as const, message: "已儲存報價。" };
}

export async function deleteQuote(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("stock_quotes").delete().eq("user_id", user.id).eq("id", id);
  revalidatePath("/stocks");
  revalidatePath("/stocks/positions");
  revalidatePath("/stocks/quotes");
}

export async function syncLatestQuotes(_formData?: FormData): Promise<void> {
  await syncQuotesForUser();
  revalidatePath("/stocks");
  revalidatePath("/stocks/positions");
  revalidatePath("/stocks/quotes");
}

export async function fetchSingleQuote(
  market: "TW" | "US",
  symbol: string
): Promise<{
  ok: boolean;
  close?: number;
  quote_date?: string;
  is_realtime?: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false, message: "尚未登入。" };

  const q = await fetchClose(market, symbol.toUpperCase());
  if (!q) return { ok: false, message: `查無 ${market}:${symbol} 報價。` };

  await supabase.from("stock_quotes").upsert(
    {
      user_id: user.id,
      market,
      symbol: symbol.toUpperCase(),
      quote_date: q.quote_date,
      close: q.close,
      prev_close: q.prev_close,
      currency: market === "TW" ? "TWD" : "USD",
    },
    { onConflict: "user_id,market,symbol,quote_date" }
  );

  revalidatePath("/stocks");
  revalidatePath("/stocks/positions");

  return {
    ok: true,
    close: q.close,
    quote_date: q.quote_date,
    is_realtime: q.is_realtime,
    message: q.is_realtime ? "即時價格" : "收盤 / 盤前後價格",
  };
}
