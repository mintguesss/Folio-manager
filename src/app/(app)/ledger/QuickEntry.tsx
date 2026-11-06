"use client";

import { useState, useTransition } from "react";
import type { LedgerEntry } from "./LedgerRecordList";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

/** 台灣時間的今天（YYYY-MM-DD） */
function todayTW() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 常記的一筆：🍱 便當、現金。金額和類別沿用上一次記的便當 */
export function QuickEntry({
  entries,
  createAction,
}: {
  entries: LedgerEntry[];
  createAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const last = [...entries]
    .reverse()
    .find((e) => [e.category_text, e.counterparty, e.memo].some((v) => v?.includes("便當")));
  const [amount, setAmount] = useState(last ? String(Number(last.amount)) : "");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>(undefined);

  function save() {
    const fd = new FormData();
    fd.set("occurred_on", todayTW());
    fd.set("entry_type", "expense");
    fd.set("amount", amount);
    fd.set("account", "現金");
    if (last) {
      fd.set("category_text", last.category_text ?? "");
      fd.set("counterparty", last.counterparty ?? "");
      fd.set("memo", last.memo ?? "");
    } else {
      fd.set("category_text", "便當");
    }
    setResult(undefined);
    start(async () => setResult(await createAction(fd)));
  }

  const valid = Number(amount) > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
      <span className="text-sm font-medium text-white">🍱 便當</span>
      <span className="text-xs text-zinc-500">現金 · 今天</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="金額"
        aria-label="便當金額"
        className="ml-auto w-24 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm tabular-nums text-rose-300 outline-none focus:border-white/25"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending || !valid}
        className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white active:scale-95 disabled:opacity-50"
      >
        {pending ? "記帳中…" : "記一筆"}
      </button>
      {result && (
        <span className={["w-full text-right text-xs", result.ok ? "text-emerald-400" : "text-rose-400"].join(" ")}>
          {result.ok ? "記好了" : result.message}
        </span>
      )}
    </div>
  );
}
