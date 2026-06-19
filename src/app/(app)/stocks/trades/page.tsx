import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TradesTable } from "./TradesTable";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;
  const marketFilter = market === "TW" || market === "US" ? market : "ALL";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let q = supabase
    .from("stock_trades")
    .select("id,trade_date,market,symbol,name,side,quantity,price,currency,fee,tax,note,created_at")
    .eq("user_id", user?.id ?? "")
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (marketFilter !== "ALL") q = q.eq("market", marketFilter);

  const { data: trades, error } = await q;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">交易列表</h1>
          <p className="mt-1 text-sm text-zinc-300">手動新增買賣紀錄，後續會用它計算持股與損益。</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/stocks"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
          >
            返回
          </Link>
          <Link
            href="/stocks/trades/new"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            新增交易
          </Link>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/stocks/trades"
          className={[
            "rounded-xl px-3 py-2 font-medium",
            marketFilter === "ALL"
              ? "bg-white/10 text-white border border-white/15"
              : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10",
          ].join(" ")}
        >
          全部
        </Link>
        <Link
          href="/stocks/trades?market=TW"
          className={[
            "rounded-xl px-3 py-2 font-medium",
            marketFilter === "TW"
              ? "bg-white/10 text-white border border-white/15"
              : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10",
          ].join(" ")}
        >
          台股
        </Link>
        <Link
          href="/stocks/trades?market=US"
          className={[
            "rounded-xl px-3 py-2 font-medium",
            marketFilter === "US"
              ? "bg-white/10 text-white border border-white/15"
              : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10",
          ].join(" ")}
        >
          美股
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        {error ? (
          <p className="text-sm text-red-700">讀取失敗：{error.message}</p>
        ) : null}

        <TradesTable trades={(trades ?? []).map((t) => ({
          id: t.id,
          trade_date: t.trade_date,
          market: t.market,
          symbol: t.symbol,
          name: t.name ?? null,
          side: t.side,
          quantity: Number(t.quantity),
          price: Number(t.price),
          currency: t.currency,
          fee: Number(t.fee),
          tax: Number(t.tax),
          note: t.note ?? null,
        }))} />
      </div>
    </div>
  );
}

