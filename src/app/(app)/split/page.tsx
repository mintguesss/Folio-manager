import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { addFx, fmtFxBag, toTravelCurrency, type FxBag } from "@/lib/currency";
import { createSplitGroup, deleteSplitGroup, acceptSplitGroupInvite } from "@/app/actions/split";
import { SplitGroupForm } from "@/components/SplitGroupForm";
import { DeleteButton } from "@/components/DeleteButton";

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

export default async function SplitPage() {
  const supabase = await createClient();
  const user = await getUser();

  // 擁有的群組、被共享的群組、待接受的邀請彼此無關，同時查
  const [{ data: ownedGroups }, { data: memberEntries }, { data: pendingInvites }] = await Promise.all([
    supabase
      .from("split_groups")
      .select("id, name, group_type, description, created_at")
      .eq("user_id", user?.id ?? "")
      .order("created_at", { ascending: false }),
    // Groups the user is a member of (not owner)
    supabase
      .from("split_group_users")
      .select("group_id, split_groups(id, name, group_type, description, created_at)")
      .eq("user_id", user?.id ?? ""),
    // Pending invites for current user (requires RLS policy on split_group_invites)
    supabase
      .from("split_group_invites")
      .select("id, group_id, split_groups(name, group_type)")
      .eq("status", "pending"),
  ]);

  const ownedIds = new Set((ownedGroups ?? []).map((g) => g.id));
  type GroupRow = { id: string; name: string; group_type: string; description: string | null; created_at: string };
  const sharedGroups: GroupRow[] = (memberEntries ?? [])
    .map((e) => {
      const g = e.split_groups as unknown;
      const row = Array.isArray(g) ? g[0] : g;
      return row as GroupRow | null;
    })
    .filter((g): g is GroupRow => !!g && !ownedIds.has(g.id));

  // Expense totals for all accessible groups
  const allGroupIds = [
    ...(ownedGroups ?? []).map((g) => g.id),
    ...sharedGroups.map((g) => g.id),
  ];
  const { data: expenses } =
    allGroupIds.length > 0
      ? await supabase
          .from("split_expenses")
          .select("group_id, amount, currency, exchange_rate")
          .in("group_id", allGroupIds)
      : { data: [] };

  const totals: Record<string, { twd: number; fx: FxBag }> = {};
  for (const e of expenses ?? []) {
    if (!totals[e.group_id]) totals[e.group_id] = { twd: 0, fx: {} };
    if (e.currency !== "TWD") {
      if (e.exchange_rate) totals[e.group_id].twd += Math.round(Number(e.amount) * Number(e.exchange_rate));
      else addFx(totals[e.group_id].fx, toTravelCurrency(e.currency), Number(e.amount));
    } else {
      totals[e.group_id].twd += Number(e.amount);
    }
  }

  function totalLabel(groupId: string) {
    const t = totals[groupId];
    if (!t) return "0";
    const parts: string[] = [];
    if (t.twd > 0) parts.push(`TWD ${fmt(t.twd)}`);
    if (fmtFxBag(t.fx)) parts.push(fmtFxBag(t.fx));
    return parts.length > 0 ? parts.join(" · ") : "0";
  }

  const allGroups = [
    ...(ownedGroups ?? []).map((g) => ({ ...g, isOwned: true })),
    ...sharedGroups.map((g) => ({ ...g, isOwned: false })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">分帳</h1>
        <p className="mt-1 text-sm text-zinc-300">
          建立群組，記錄共同支出，自動計算誰欠誰。
        </p>
      </div>

      <SplitGroupForm onCreate={createSplitGroup} />

      {/* Pending invites */}
      {(pendingInvites ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-300/80">待接受邀請</h2>
          {(pendingInvites ?? []).map((inv) => {
            const raw = inv.split_groups as unknown;
            const g = (Array.isArray(raw) ? raw[0] : raw) as { name: string; group_type: string } | null;
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{g?.name ?? "群組"}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-400">
                      {g?.group_type === "travel" ? "出國" : "一般"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">邀請你加入此分帳群組</p>
                </div>
                <form action={acceptSplitGroupInvite as unknown as (fd: FormData) => void}>
                  <input type="hidden" name="invite_id" value={inv.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
                  >
                    加入
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {allGroups.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          還沒有分帳群組，新增一個吧。
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">我的群組</h2>
          {allGroups.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur transition-colors hover:bg-black/40"
            >
              <Link href={`/split/${g.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{g.name}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-400">
                    {g.group_type === "travel" ? "出國" : "一般"}
                  </span>
                  {!g.isOwned && (
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-xs text-sky-400">共享</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {totalLabel(g.id)}
                  {g.description ? ` · ${g.description}` : ""}
                </div>
              </Link>
              {g.isOwned && (
                <>
                  <Link
                    href={`/split/${g.id}/edit`}
                    className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  <form action={deleteSplitGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <DeleteButton />
                  </form>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
