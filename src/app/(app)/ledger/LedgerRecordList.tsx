"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteLedgerEntry } from "@/app/actions/ledger";
import { DeleteButton } from "@/components/DeleteButton";

export type LedgerEntry = {
  id: string;
  occurred_on: string;
  entry_type: string | null;
  amount: number;
  account: string | null;
  category_text: string | null;
  counterparty: string | null;
  memo: string | null;
};

const TYPE = {
  income:   { label: "收入", badge: "bg-emerald-500/15 text-emerald-300", border: "border-l-emerald-500/60", amount: "text-emerald-300" },
  expense:  { label: "支出", badge: "bg-rose-500/15 text-rose-300",       border: "border-l-rose-500/60",    amount: "text-rose-300"    },
  transfer: { label: "轉帳", badge: "bg-sky-500/15 text-sky-300",         border: "border-l-sky-500/60",     amount: "text-sky-300"     },
} as const;

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

function typeOf(e: LedgerEntry) {
  const t = (e.entry_type ?? "expense") as keyof typeof TYPE;
  return TYPE[t] ?? TYPE.expense;
}
function displayAmt(e: LedgerEntry) {
  const t = e.entry_type ?? "expense";
  const sign = t === "income" ? 1 : t === "transfer" ? 0 : -1;
  return sign === 0 ? Number(e.amount) : sign * Number(e.amount);
}

function MobileRow({ e, isOpen, onToggle }: { e: LedgerEntry; isOpen: boolean; onToggle: () => void }) {
  const cfg = typeOf(e);
  const amt = displayAmt(e);
  const hasExtra = e.account || e.counterparty || e.memo;

  return (
    <div className={["border-l-2", cfg.border].join(" ")}>
      {/* 收合列 */}
      <button
        type="button"
        onClick={() => hasExtra && onToggle()}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
      >
        <span className={["inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold", cfg.badge].join(" ")}>
          {cfg.label}
        </span>
        <span className="flex-1 truncate text-xs text-zinc-300">
          {e.category_text || ""}
        </span>
        <span className={["shrink-0 tabular-nums text-sm font-semibold", cfg.amount].join(" ")}>
          {fmt(amt)}
        </span>
        {hasExtra && (
          <svg
            className={["h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200", isOpen ? "rotate-180" : ""].join(" ")}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* 展開內容 */}
      {isOpen && (
        <div className="border-t border-white/5 bg-white/[0.015] px-3 pb-3 pt-2.5">
          <div className="flex flex-wrap gap-x-10 gap-y-1.5 text-xs">
            {e.account && (
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500">支付方式</span>
                <span className="text-zinc-300">{e.account}</span>
              </div>
            )}
            {e.counterparty && (
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500">對象</span>
                <span className="text-zinc-300">{e.counterparty}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1">
            {e.memo && (
              <span className="flex flex-1 items-baseline gap-2 truncate text-xs">
                <span className="shrink-0 text-zinc-500">備註</span>
                <span className="truncate text-zinc-300">{e.memo}</span>
              </span>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Link
                href={`/ledger/edit/${e.id}`}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
              >
                修改
              </Link>
              <form action={deleteLedgerEntry}>
                <input type="hidden" name="id" value={e.id} />
                <DeleteButton className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300" />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopRow({ e }: { e: LedgerEntry }) {
  const cfg = typeOf(e);
  const amt = displayAmt(e);
  return (
    <tr
      className={["border-l-2 transition-colors hover:bg-white/[0.025]", cfg.border].join(" ")}
    >
      <td className="px-4 py-3">
        <span className={["inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold", cfg.badge].join(" ")}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-300">{e.category_text ?? "—"}</td>
      <td className="px-4 py-3 text-zinc-300">{e.account ?? "—"}</td>
      <td className="px-4 py-3 text-zinc-300">{e.counterparty ?? "—"}</td>
      <td className={["px-4 py-3 text-right tabular-nums font-semibold", cfg.amount].join(" ")}>
        {fmt(amt)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/ledger/edit/${e.id}`}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            修改
          </Link>
          <form action={deleteLedgerEntry}>
            <input type="hidden" name="id" value={e.id} />
            <DeleteButton className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300" />
          </form>
        </div>
      </td>
    </tr>
  );
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}/${d}（${WEEK[w]}）`;
}

/** 依日期分組，保持原本的順序（新的在前） */
function groupByDay(rows: LedgerEntry[]) {
  const days: { date: string; rows: LedgerEntry[]; out: number; inc: number }[] = [];
  for (const e of rows) {
    let g = days[days.length - 1];
    if (!g || g.date !== e.occurred_on) {
      g = { date: e.occurred_on, rows: [], out: 0, inc: 0 };
      days.push(g);
    }
    g.rows.push(e);
    const t = e.entry_type ?? "expense";
    if (t === "expense") g.out += Number(e.amount);
    else if (t === "income") g.inc += Number(e.amount);
  }
  return days;
}

function DaySummary({ date, count, out, inc, open }: { date: string; count: number; out: number; inc: number; open: boolean }) {
  return (
    <>
      <svg
        className={["h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200", open ? "" : "-rotate-90"].join(" ")}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span className="font-semibold tabular-nums text-zinc-100">{dayLabel(date)}</span>
      <span className="text-xs text-zinc-500">{count} 筆</span>
      <span className="ml-auto flex items-baseline gap-3 tabular-nums text-xs">
        {inc > 0 && <span className="text-emerald-300">+{fmt(inc)}</span>}
        {out > 0 && <span className="text-rose-300">-{fmt(out)}</span>}
      </span>
    </>
  );
}

export function LedgerRecordList({ entries }: { entries: LedgerEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const days = groupByDay([...entries].reverse());
  // 預設只展開最新那天；記的是「手動改過」的日子
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());
  const isDayOpen = (date: string, i: number) => (i === 0) !== toggled.has(date);
  const toggleDay = (date: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  if (days.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">尚無紀錄，先新增一筆吧。</p>;
  }

  return (
    <>
      {/* ── 手機：依日期分組的 accordion ── */}
      <div className="space-y-2 sm:hidden">
        {days.map((g, i) => {
          const open = isDayOpen(g.date, i);
          return (
            <div key={g.date} className="overflow-hidden rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => toggleDay(g.date)}
                className="flex w-full items-center gap-2 bg-white/[0.03] px-3 py-2.5 text-left text-sm"
              >
                <DaySummary date={g.date} count={g.rows.length} out={g.out} inc={g.inc} open={open} />
              </button>
              {open && (
                <div className="divide-y divide-white/5 border-t border-white/5">
                  {g.rows.map((e) => (
                    <MobileRow key={e.id} e={e} isOpen={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 電腦：table，每天一個標題列 ── */}
      <div className="hidden sm:block overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-900/80 text-xs text-zinc-400 backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-medium">類型</th>
              <th className="px-4 py-3 font-medium">分類</th>
              <th className="px-4 py-3 font-medium">支付方式</th>
              <th className="px-4 py-3 font-medium">對象</th>
              <th className="px-4 py-3 font-medium text-right">金額</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          {days.map((g, i) => {
            const open = isDayOpen(g.date, i);
            return (
              <tbody key={g.date} className="divide-y divide-white/5 border-t border-white/10">
                <tr className="cursor-pointer bg-white/[0.03] hover:bg-white/[0.05]" onClick={() => toggleDay(g.date)}>
                  <td colSpan={6} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <DaySummary date={g.date} count={g.rows.length} out={g.out} inc={g.inc} open={open} />
                    </div>
                  </td>
                </tr>
                {open && g.rows.map((e) => <DesktopRow key={e.id} e={e} />)}
              </tbody>
            );
          })}
        </table>
      </div>
    </>
  );
}
