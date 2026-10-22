import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { deleteAssetSnapshot } from "@/app/actions/assets";
import { DeleteButton } from "@/components/DeleteButton";
import { AssetModal } from "@/components/AssetModal";
import { NetWorthHistoryChart, type NetWorthPoint } from "@/components/NetWorthHistoryChart";

function formatNumber(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

export default async function NetWorthPage() {
  const supabase = await createClient();
  const user = await getUser();

  const { data: snapshots } = await supabase
    .from("asset_snapshots")
    .select(
      "snapshot_date,total_assets,bank_huanan,bank_ctbc,bank_post,bank_taishin,tw_stock_value,us_stock_value,note"
    )
    .eq("user_id", user?.id ?? "")
    .order("snapshot_date", { ascending: true });

  const chartData: NetWorthPoint[] =
    snapshots?.map((s) => ({
      snapshot_date: s.snapshot_date,
      total_assets: Number(s.total_assets ?? 0),
      bank_huanan: Number(s.bank_huanan ?? 0),
      bank_ctbc: Number(s.bank_ctbc ?? 0),
      bank_post: Number(s.bank_post ?? 0),
      bank_taishin: Number(s.bank_taishin ?? 0),
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">資產記帳</h1>
          <p className="mt-1 text-sm text-zinc-300">
            依日期記錄總資產與各項資產，用來做資產成長與趨勢分析。
          </p>
        </div>
        <AssetModal />
      </div>

      <NetWorthHistoryChart data={chartData} />

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-white">歷史紀錄</h2>
          <span className="text-xs text-zinc-400">共 {snapshots?.length ?? 0} 筆</span>
        </div>

        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/40 text-xs text-zinc-300">
              <tr>
                <th className="px-3 py-2 font-medium">日期</th>
                <th className="px-3 py-2 font-medium text-right">總資產</th>
                <th className="px-3 py-2 font-medium text-right">華南</th>
                <th className="px-3 py-2 font-medium text-right">中國信託</th>
                <th className="px-3 py-2 font-medium text-right">郵局</th>
                <th className="px-3 py-2 font-medium text-right">台新</th>
                <th className="px-3 py-2 font-medium text-right">台股</th>
                <th className="px-3 py-2 font-medium text-right">美股</th>
                <th className="px-3 py-2 font-medium">備註</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(snapshots ?? [])
                .slice()
                .reverse()
                .map((s) => (
                  <tr key={s.snapshot_date} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium text-white">{s.snapshot_date}</td>
                    <td className="px-3 py-2 tabular-nums text-right text-white">
                      {formatNumber(Number(s.total_assets ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.bank_huanan ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.bank_ctbc ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.bank_post ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.bank_taishin ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.tw_stock_value ?? 0))}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right text-zinc-300">
                      {formatNumber(Number(s.us_stock_value ?? 0))}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-400">{s.note ?? ""}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/networth/edit/${s.snapshot_date}`}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-white/5"
                        >
                          修改
                        </Link>
                        <form action={deleteAssetSnapshot}>
                          <input type="hidden" name="snapshot_date" value={s.snapshot_date} />
                          <DeleteButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              {(!snapshots || snapshots.length === 0) && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-zinc-500">
                    尚無紀錄，點擊右上角「新增資產快照」開始記錄。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-zinc-400">
          小提醒：你可以先把「總資產」填準確，細項之後再慢慢補齊也沒問題。
        </p>
      </div>
    </div>
  );
}
