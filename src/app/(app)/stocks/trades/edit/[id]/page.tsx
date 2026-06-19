import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TradeEditForm } from "@/components/TradeEditForm";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trade } = await supabase
    .from("stock_trades")
    .select("id,market,symbol,name,side,trade_date,quantity,price,currency,fee,tax,fx_rate,note")
    .eq("user_id", user.id)
    .eq("id", id)
    .single();

  if (!trade) redirect("/stocks/trades");

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-white">修改交易</h1>
        <Link href="/stocks/trades" className="text-sm font-medium text-zinc-200 hover:underline">
          返回交易列表
        </Link>
      </div>

      <TradeEditForm
        trade={{
          id: trade.id,
          market: trade.market as "TW" | "US",
          symbol: trade.symbol,
          name: trade.name ?? null,
          side: trade.side as "BUY" | "SELL",
          trade_date: trade.trade_date,
          quantity: Number(trade.quantity),
          price: Number(trade.price),
          currency: String(trade.currency ?? ""),
          fee: Number(trade.fee ?? 0),
          tax: Number(trade.tax ?? 0),
          fx_rate: trade.fx_rate != null ? Number(trade.fx_rate) : null,
          note: trade.note ?? null,
        }}
      />
    </div>
  );
}
