"use client";

import { useState, useEffect, useActionState } from "react";
import { settleAllGroupShares } from "@/app/actions/split";
import { fmtFx, type TravelCurrency } from "@/lib/currency";

type Member = { id: string; name: string };
type Debt = { debtor_id: string; creditor_id: string; fx: number; twd: number };

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

function computeNetDebts(debts: Debt[]): Debt[] {
  const netTWD = new Map<string, number>();
  const netFx = new Map<string, number>();

  for (const d of debts) {
    const forward = d.debtor_id < d.creditor_id;
    const key = forward
      ? `${d.debtor_id}:${d.creditor_id}`
      : `${d.creditor_id}:${d.debtor_id}`;
    const sign = forward ? 1 : -1;
    netTWD.set(key, (netTWD.get(key) ?? 0) + sign * d.twd);
    netFx.set(key, (netFx.get(key) ?? 0) + sign * d.fx);
  }

  const keys = new Set([...netTWD.keys(), ...netFx.keys()]);
  const result: Debt[] = [];

  for (const key of keys) {
    const [a, b] = key.split(":");
    const twd = netTWD.get(key) ?? 0;
    const fx = netFx.get(key) ?? 0;
    if (Math.abs(twd) < 0.5 && Math.abs(fx) < 0.005) continue;

    if ((twd >= 0 && fx >= 0) || (twd <= 0 && fx <= 0)) {
      const positive = twd > 0 || (twd === 0 && fx >= 0);
      result.push({ debtor_id: positive ? a : b, creditor_id: positive ? b : a, twd: Math.abs(twd), fx: Math.abs(fx) });
    } else {
      if (Math.abs(twd) > 0.5)
        result.push({ debtor_id: twd > 0 ? a : b, creditor_id: twd > 0 ? b : a, twd: Math.abs(twd), fx: 0 });
      if (Math.abs(fx) >= 0.005)
        result.push({ debtor_id: fx > 0 ? a : b, creditor_id: fx > 0 ? b : a, twd: 0, fx: Math.abs(fx) });
    }
  }

  return result;
}

export function SettlementModal({
  debts,
  members,
  groupId,
  selfMemberId,
  currency,
}: {
  debts: Debt[];
  members: Member[];
  groupId: string;
  selfMemberId: string | undefined;
  currency: TravelCurrency;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<{ ok: boolean } | undefined, FormData>(
    async (_, fd) => settleAllGroupShares(fd),
    undefined
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const netted = computeNetDebts(debts);
  const hasChanges =
    netted.length !== debts.length ||
    netted.some((n) => {
      const orig = debts.find((d) => d.debtor_id === n.debtor_id && d.creditor_id === n.creditor_id);
      return !orig || orig.twd !== n.twd || orig.fx !== n.fx;
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-300/70 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
      >
        一鍵結算
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Card */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl bg-zinc-800 shadow-2xl">
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-violet-500" />

            <div className="px-6 pt-5 pb-6">
              {/* Header row */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white">一鍵結算</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">互相抵扣後的實際金額</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-1.5 text-zinc-500 hover:bg-white/8 hover:text-zinc-300 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Debt rows */}
              {netted.length === 0 ? (
                <p className="py-6 text-center text-sm text-emerald-400">已全部結清！</p>
              ) : (
                <div className="mb-4 divide-y divide-zinc-700/60 rounded-2xl bg-zinc-700/30 overflow-hidden">
                  {netted.map((d, i) => {
                    const debtor = memberMap.get(d.debtor_id);
                    const creditor = memberMap.get(d.creditor_id);
                    const debtorIsMe = d.debtor_id === selfMemberId;
                    const creditorIsMe = d.creditor_id === selfMemberId;
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        {/* Names */}
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                          <span className={debtorIsMe ? "font-semibold text-white" : "text-zinc-200"}>
                            {debtor?.name ?? "?"}
                            {debtorIsMe && <span className="text-zinc-500">（我）</span>}
                          </span>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0 text-zinc-500">
                            <path d="M3 8h10M9 4l4 4-4 4" />
                          </svg>
                          <span className={creditorIsMe ? "font-semibold text-white" : "text-zinc-200"}>
                            {creditor?.name ?? "?"}
                            {creditorIsMe && <span className="text-zinc-500">（我）</span>}
                          </span>
                        </div>

                        {/* Amounts */}
                        <div className="shrink-0 text-right">
                          {d.twd > 0.5 && (
                            <div className="tabular-nums text-sm font-semibold text-rose-300">
                              {fmt(d.twd)}<span className="ml-0.5 text-xs font-normal text-rose-400/50">元</span>
                            </div>
                          )}
                          {d.fx >= 0.005 && (
                            <div className={["tabular-nums text-xs", d.twd > 0.5 ? "text-zinc-500" : "font-semibold text-rose-300"].join(" ")}>
                              {fmtFx(d.fx, currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Netting notice */}
              {hasChanges && netted.length > 0 && (
                <p className="mb-4 text-xs text-zinc-500 text-center">
                  ✦ 已自動抵扣雙方互欠金額
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-2xl bg-zinc-700/60 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  取消
                </button>
                <form action={action} className="flex-1">
                  <input type="hidden" name="group_id" value={groupId} />
                  <button
                    type="submit"
                    disabled={pending || netted.length === 0}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {pending ? "結清中…" : "確認全部結清"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
