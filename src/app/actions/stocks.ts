"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { fetchUSDTWDForDate } from "@/lib/stock-utils";
import { z } from "zod";

const Market = z.enum(["TW", "US"]);
const Side = z.enum(["BUY", "SELL"]);
const Money = z.coerce.number().finite().min(0);
const Qty = z.coerce.number().finite().positive();

const TradeSchema = z.object({
  market: Market,
  symbol: z
    .string()
    .min(1)
    .transform((s) => s.trim().toUpperCase()),
  name: z.string().optional().transform((s) => (s ? s.trim() : null)),
  trade_date: z.string().min(8),
  side: Side,
  quantity: Qty,
  price: Money,
  currency: z.string().min(3).max(8).transform((s) => s.trim().toUpperCase()),
  fee: Money.default(0),
  tax: Money.default(0),
  fx_rate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().finite().positive().nullable()
  ).optional().default(null),
  note: z.string().optional().transform((s) => (s ? s.trim() : null)),
});

export async function createTrade(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = TradeSchema.safeParse({
    market: formData.get("market"),
    symbol: formData.get("symbol"),
    name: formData.get("name"),
    trade_date: formData.get("trade_date"),
    side: formData.get("side"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    fee: formData.get("fee") ?? 0,
    tax: formData.get("tax") ?? 0,
    fx_rate: formData.get("fx_rate"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };
  }

  const row = {
    user_id: user.id,
    ...parsed.data,
  };

  const { error } = await supabase.from("stock_trades").insert(row);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/stocks");
  revalidatePath("/stocks/trades");
  revalidatePath("/stocks/positions");
  redirect("/stocks/positions");
}

export async function updateTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, message: "缺少 ID。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = TradeSchema.safeParse({
    market: formData.get("market"),
    symbol: formData.get("symbol"),
    name: formData.get("name"),
    trade_date: formData.get("trade_date"),
    side: formData.get("side"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    fee: formData.get("fee") ?? 0,
    tax: formData.get("tax") ?? 0,
    fx_rate: formData.get("fx_rate"),
    note: formData.get("note"),
  });

  if (!parsed.success) return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };

  const { error } = await supabase
    .from("stock_trades")
    .update(parsed.data)
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/stocks");
  revalidatePath("/stocks/trades");
  revalidatePath("/stocks/positions");
  redirect("/stocks/trades");
}

export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("stock_trades").delete().eq("user_id", user.id).eq("id", id);
  revalidatePath("/stocks");
  revalidatePath("/stocks/trades");
}

export async function backfillUSFxRates(): Promise<{ updated: number; failed: number }> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { updated: 0, failed: 0 };

  const { data: trades } = await supabase
    .from("stock_trades")
    .select("id,trade_date")
    .eq("user_id", user.id)
    .eq("market", "US")
    .is("fx_rate", null);

  if (!trades?.length) return { updated: 0, failed: 0 };

  // Group by date to minimize API calls
  const byDate = new Map<string, string[]>();
  for (const t of trades) {
    const ids = byDate.get(t.trade_date) ?? [];
    ids.push(t.id);
    byDate.set(t.trade_date, ids);
  }

  let updated = 0;
  let failed = 0;
  for (const [date, ids] of byDate) {
    try {
      const rate = await fetchUSDTWDForDate(date);
      const { error } = await supabase
        .from("stock_trades")
        .update({ fx_rate: rate })
        .eq("user_id", user.id)
        .in("id", ids);
      if (error) { failed += ids.length; } else { updated += ids.length; }
    } catch {
      failed += ids.length;
    }
  }

  revalidatePath("/stocks");
  revalidatePath("/stocks/positions");
  return { updated, failed };
}
