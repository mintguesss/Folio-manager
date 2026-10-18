"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { deleteSplitExpense, exportSplitToLedger, toggleSplitShare } from "@/app/actions/split";
import { DeleteButton } from "@/components/DeleteButton";
import { fmtFx, toTravelCurrency } from "@/lib/currency";

type Share = { id: string; member_id: string; share_amount: number; is_settled: boolean };
type Member = { id: string; name: string; is_self: boolean };
type Expense = {
  id: string;
  paid_by: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  exchange_rate: number | null;
  category: string | null;
  note: string | null;
};

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

function SettleButton({ settled }: { settled: boolean }) {
  return (
    <button
      type="submit"
      className={[
        "rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
        settled
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300",
      ].join(" ")}
    >
      {settled ? "已結清" : "未結清"}
    </button>
  );
}

type ExportResult = { ok: boolean; message: string } | undefined;

export function SplitExpenseCard({
  expense,
  shares,
  members,
  groupId,
  isExported: isExportedProp,
  selfMemberId,
}: {
  expense: Expense;
  shares: Share[];
  members: Member[];
  groupId: string;
  isExported: boolean;
  selfMemberId: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [exportState, exportAction, exportPending] = useActionState<ExportResult, FormData>(
    async (_prev, fd) => exportSplitToLedger(fd),
    undefined
  );

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const payer = memberMap.get(expense.paid_by);
  const allSettled = shares.length > 0 && shares.every((s) => s.is_settled);
  const selfMember = members.find((m) => (selfMemberId ? m.id === selfMemberId : m.is_self));
  const selfShare = selfMember ? shares.find((s) => s.member_id === selfMember.id) : undefined;
  const canExport = selfShare?.is_settled === true;
  const isExported = isExportedProp || exportState?.ok === true;
  const isFx = expense.currency !== "TWD";
  const fxCur = toTravelCurrency(expense.currency);
  const exRate = expense.exchange_rate ? Number(expense.exchange_rate) : null;
  const amount = Number(expense.amount);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
      {/* Header — always visible */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Toggle button with all info */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          {/* Row 1: chevron + description + badges */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <svg
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className={["h-3 w-3 shrink-0 text-zinc-500 transition-transform", open ? "rotate-180" : ""].join(" ")}
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
            <span className="font-medium text-white">
              {expense.description || <span className="text-zinc-500">（無描述）</span>}
            </span>
            {expense.category && (
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-300">
                {expense.category}
              </span>
            )}
            {allSettled && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">結清</span>
            )}
            {!allSettled && shares.length > 0 && (
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-400">未結清</span>
            )}
          </div>

          {/* Row 2: meta + amount on same line */}
          <div className="mt-1 flex items-baseline justify-between gap-x-3 pl-5 text-xs text-zinc-400">
            <span className="min-w-0 truncate">
              {expense.expense_date}
              <span className="hidden sm:inline">{" · "}{payer?.name ?? "?"}{payer?.is_self ? "（我）" : ""} 付款</span>
              {expense.note ? ` · ${expense.note}` : ""}
            </span>
            <span className="shrink-0 tabular-nums">
              {isFx ? (
                exRate ? (
                  <>
                    <span className="font-semibold text-white">{fmt(Math.round(amount * exRate))}</span>
                    <span className="ml-1 text-zinc-400">TWD</span>
                    <span className="ml-2 text-zinc-500">{fmtFx(amount, fxCur)}</span>
                  </>
                ) : (
                  <span className="font-semibold text-white">{fmtFx(amount, fxCur)}</span>
                )
              ) : (
                <>
                  <span className="font-semibold text-white">{fmt(amount)}</span>
                  <span className="ml-1 text-zinc-400">TWD</span>
                </>
              )}
            </span>
          </div>

          {exportState && (
            <p className={["mt-0.5 pl-5 text-xs", exportState.ok ? "text-emerald-400" : "text-red-400"].join(" ")}>
              {exportState.message}
            </p>
          )}
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {canExport && isExported && (
            <span className="px-1.5 text-emerald-400" title="已新增到記帳">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
          {canExport && !isExported && (
            <form action={exportAction}>
              <input type="hidden" name="expense_id" value={expense.id} />
              <button
                type="submit"
                disabled={exportPending}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-emerald-400 transition-colors disabled:opacity-40"
                title="新增到記帳"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </form>
          )}
          <Link
            href={`/split/${groupId}/expense/${expense.id}/edit`}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
          <form action={deleteSplitExpense}>
            <input type="hidden" name="id" value={expense.id} />
            <input type="hidden" name="group_id" value={groupId} />
            <DeleteButton />
          </form>
        </div>
      </div>

      {/* Per-member shares — collapsible */}
      {open && shares.length > 0 && (
        <div className="divide-y divide-white/5 border-t border-white/5">
          {shares.map((s) => {
            const member = memberMap.get(s.member_id);
            const isPayer = s.member_id === expense.paid_by;
            const shareAmt = Number(s.share_amount);
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2">
                <span className="flex-1 text-xs text-zinc-200">
                  {member?.name ?? "?"}
                  {(selfMemberId ? member?.id === selfMemberId : member?.is_self) && <span className="ml-1.5 text-zinc-400">（我）</span>}
                  {isPayer && <span className="ml-1.5 text-zinc-400">付款者</span>}
                </span>
                <div className="space-y-0.5 text-right">
                  {isFx ? (
                    <>
                      {exRate && (
                        <div className="tabular-nums text-xs text-zinc-300">
                          {fmt(Math.round(shareAmt * exRate))} <span className="text-zinc-500">TWD</span>
                        </div>
                      )}
                      <div className="tabular-nums text-xs text-zinc-500">{fmtFx(shareAmt, fxCur)}</div>
                    </>
                  ) : (
                    <div className="tabular-nums text-xs text-zinc-300">{fmt(shareAmt)}</div>
                  )}
                </div>
                <form action={toggleSplitShare}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="group_id" value={groupId} />
                  <input type="hidden" name="is_settled" value={String(s.is_settled)} />
                  <SettleButton settled={s.is_settled} />
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
