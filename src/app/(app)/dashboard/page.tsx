import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { AssetGrowthChart, type AssetPoint } from "@/components/AssetGrowthChart";

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, hint, colored }: { label: string; value: string; hint?: string; colored?: boolean }) {
  const isNeg = value.startsWith("-");
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className={["mt-2 text-2xl font-semibold tabular-nums", colored ? (isNeg ? "text-rose-300" : "text-emerald-300") : "text-white"].join(" ")}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

const SIDE_LABEL: Record<string, string> = { BUY: "買入", SELL: "賣出" };
const MARKET_LABEL: Record<string, string> = { TW: "台股", US: "美股" };
const ENTRY_TYPE_LABEL: Record<string, string> = { income: "收入", expense: "支出", transfer: "轉帳" };
const ENTRY_COLOR: Record<string, string> = {
  income: "text-emerald-300",
  expense: "text-rose-300",
  transfer: "text-zinc-300",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getUser();

  const uid = user?.id ?? "";

  const [
    { data: snapshots },
    { data: recentTrades },
    { data: recentLedger },
  ] = await Promise.all([
    supabase
      .from("asset_snapshots")
      .select("snapshot_date,total_assets,tw_stock_value,us_stock_value")
      .eq("user_id", uid)
      .order("snapshot_date", { ascending: true }),
    supabase
      .from("stock_trades")
      .select("market,symbol,side,quantity,price,currency,trade_date")
      .eq("user_id", uid)
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ledger_entries")
      .select("occurred_on,entry_type,amount,currency,category_text,memo")
      .eq("user_id", uid)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const latest = snapshots?.[snapshots.length - 1];
  const prev = snapshots?.[snapshots.length - 2];

  const chartData: AssetPoint[] =
    snapshots?.map((s) => ({
      snapshot_date: s.snapshot_date,
      total_assets: Number(s.total_assets ?? 0),
      tw_stock_value: Number(s.tw_stock_value ?? 0),
      us_stock_value: Number(s.us_stock_value ?? 0),
    })) ?? [];

  const latestTotal = Number(latest?.total_assets ?? 0);
  const prevTotal = Number(prev?.total_assets ?? 0);
  const change = latestTotal - prevTotal;
  const changePct = prevTotal > 0 ? (change / prevTotal) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">總覽</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {latest?.snapshot_date
              ? `最近快照：${latest.snapshot_date}`
              : "尚無資產快照"}
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/stocks/trades/new"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors"
          >
            + 新增交易
          </Link>
          <Link
            href="/ledger"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors"
          >
            + 新增記帳
          </Link>
          <Link
            href="/networth"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            + 資產記帳
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="最新總資產"
          value={fmt(latestTotal)}
          hint={latest?.snapshot_date ?? "尚無資料"}
        />
        <StatCard
          label="與上次相比"
          value={change === 0 && !prev ? "-" : (change >= 0 ? "+" : "") + fmt(change)}
          hint={changePct != null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%` : undefined}
          colored={change !== 0}
        />
        <StatCard label="台股市值" value={fmt(Number(latest?.tw_stock_value ?? 0))} />
        <StatCard label="美股市值" value={fmt(Number(latest?.us_stock_value ?? 0))} hint="USD 換算前" />
      </div>

      {/* Growth chart */}
      <AssetGrowthChart data={chartData} />

      {chartData.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-zinc-300 backdrop-blur">
          尚無資產快照。點右上角「+ 資產快照」新增第一筆，成長曲線就會出現。
        </div>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent trades */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">近期交易</h2>
            <Link href="/stocks/trades" className="text-xs text-sky-400 hover:underline">
              全部
            </Link>
          </div>
          {(recentTrades ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">尚無交易紀錄</p>
          ) : (
            <div className="space-y-2">
              {(recentTrades ?? []).map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={["rounded px-1.5 py-0.5 text-xs font-semibold", t.side === "BUY" ? "bg-sky-500/15 text-sky-300" : "bg-rose-500/15 text-rose-300"].join(" ")}>
                      {SIDE_LABEL[t.side] ?? t.side}
                    </span>
                    <span className="text-sm font-medium text-white">{t.symbol}</span>
                    <span className="text-xs text-zinc-500">{MARKET_LABEL[t.market] ?? t.market}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums text-zinc-200">
                      {Number(t.quantity).toLocaleString()} @ {Number(t.price).toLocaleString()} {t.currency}
                    </div>
                    <div className="text-xs text-zinc-500">{t.trade_date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent ledger */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">近期記帳</h2>
            <Link href="/ledger" className="text-xs text-sky-400 hover:underline">
              全部
            </Link>
          </div>
          {(recentLedger ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">尚無記帳紀錄</p>
          ) : (
            <div className="space-y-2">
              {(recentLedger ?? []).map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={["text-xs font-medium", ENTRY_COLOR[e.entry_type ?? ""] ?? "text-zinc-300"].join(" ")}>
                      {ENTRY_TYPE_LABEL[e.entry_type ?? ""] ?? e.entry_type}
                    </span>
                    <span className="text-sm text-zinc-200">
                      {e.category_text ?? e.memo ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={["text-sm font-medium tabular-nums", ENTRY_COLOR[e.entry_type ?? ""] ?? "text-zinc-200"].join(" ")}>
                      {e.entry_type === "expense" ? "-" : ""}{Number(e.amount).toLocaleString()} {e.currency}
                    </div>
                    <div className="text-xs text-zinc-500">{e.occurred_on}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
