import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { deleteQuote, syncLatestQuotes } from "@/app/actions/quotes";

function formatNumber(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 6 }).format(n);
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;
  const marketFilter = market === "TW" || market === "US" ? market : "ALL";

  const supabase = await createClient();
  const user = await getUser();

  let q = supabase
    .from("stock_quotes")
    .select("id,quote_date,market,symbol,close,currency,created_at")
    .eq("user_id", user?.id ?? "")
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (marketFilter !== "ALL") q = q.eq("market", marketFilter);

  const { data: quotes, error } = await q;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">手動報價</h1>
          <p className="mt-1 text-sm text-zinc-300">
            用來估算未實現損益（之後可以再接免費行情來源）。
          </p>
        </div>
        <div className="flex gap-2">
          <form action={syncLatestQuotes}>
            <button
              type="submit"
              className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20"
            >
              自動抓報價
            </button>
          </form>
          <Link
            href="/stocks"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
          >
            返回
          </Link>
          <Link
            href="/stocks/quotes/new"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            新增報價
          </Link>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/stocks/quotes"
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
          href="/stocks/quotes?market=TW"
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
          href="/stocks/quotes?market=US"
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
        {error ? <p className="text-sm text-red-700">讀取失敗：{error.message}</p> : null}

        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/40 text-xs text-zinc-300">
              <tr>
                <th className="px-3 py-2 font-medium">日期</th>
                <th className="px-3 py-2 font-medium">市場</th>
                <th className="px-3 py-2 font-medium">代號</th>
                <th className="px-3 py-2 font-medium text-right">收盤價</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(quotes ?? []).map((q) => (
                <tr key={q.id} className="border-t border-white/5">
                  <td className="px-3 py-2 tabular-nums">{q.quote_date}</td>
                  <td className="px-3 py-2">{q.market === "TW" ? "台股" : "美股"}</td>
                  <td className="px-3 py-2 font-medium text-white">{q.symbol}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(Number(q.close))} {q.currency}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteQuote}>
                      <input type="hidden" name="id" value={q.id} />
                      <button className="rounded-lg px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/10">
                        刪除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(quotes ?? []).length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-zinc-400" colSpan={5}>
                    尚無報價。去{" "}
                    <Link href="/stocks/quotes/new" className="font-medium underline">
                      新增報價
                    </Link>
                    。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

