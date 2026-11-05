"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Combobox } from "@/components/Combobox";
import { acceptInboxItem, acceptKnownInbox, ignoreInboxItem } from "@/app/actions/ledger";
import { CATEGORY_OPTIONS, PAYMENT_OPTIONS } from "./LedgerEntryForm";

export type InboxItem = {
  id: string;
  source: string | null;
  raw_text: string;
  amount: number | null;
  merchant: string | null;
  account: string | null;
  received_at: string;
};

export type MerchantRule = { merchant: string; category_text: string | null; account: string | null };

type Result = { ok: boolean; message: string } | undefined;

function timeLabel(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

function InboxCard({ item, rule, categories }: { item: InboxItem; rule?: MerchantRule; categories: string[] }) {
  const [category, setCategory] = useState(rule?.category_text ?? "");
  const [account, setAccount] = useState(item.account ?? rule?.account ?? "");
  const [showRaw, setShowRaw] = useState(false);
  const [state, action, pending] = useActionState<Result, FormData>((_p, fd) => acceptInboxItem(fd), undefined);
  const [ignoring, startIgnore] = useTransition();
  const busy = pending || ignoring;

  function ignore() {
    const fd = new FormData();
    fd.set("id", item.id);
    startIgnore(() => ignoreInboxItem(fd));
  }

  return (
    <div className={["rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-opacity", busy ? "pointer-events-none opacity-50" : ""].join(" ")}>
      <form action={action} className="space-y-2.5">
        <input type="hidden" name="id" value={item.id} />
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="tabular-nums">{timeLabel(item.received_at)}</span>
          {item.source && <span className="truncate">· {item.source}</span>}
          {rule?.category_text && (
            <span className="ml-auto shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">認得這家</span>
          )}
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-2">
          <input
            name="amount"
            type="number"
            min="0"
            step="any"
            defaultValue={item.amount ?? ""}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-rose-300 outline-none focus:border-white/25"
          />
          <input
            name="merchant"
            defaultValue={item.merchant ?? ""}
            placeholder="商店"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Combobox name="category_text" options={categories} value={category} onChange={setCategory} placeholder="類別" />
          <Combobox name="account" options={PAYMENT_OPTIONS} value={account} onChange={setAccount} placeholder="付款方式" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "入帳中…" : "入帳"}
          </button>
          <button type="button" onClick={() => setShowRaw((v) => !v)} className="text-xs text-zinc-500 hover:text-zinc-300">
            {showRaw ? "收起原文" : "看原文"}
          </button>
          {state && !state.ok && <span className="text-xs text-rose-400">{state.message}</span>}
          <button
            type="button"
            onClick={ignore}
            disabled={busy}
            className="ml-auto rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 active:scale-95"
          >
            {ignoring ? "處理中…" : "不記"}
          </button>
        </div>
      </form>
      {showRaw && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-[11px] text-zinc-400">{item.raw_text}</p>}
    </div>
  );
}

function AcceptKnownButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
    >
      {pending ? "入帳中…" : `認得的 ${count} 筆直接入帳`}
    </button>
  );
}

export function LedgerInbox({
  items,
  rules,
  usedCategories,
}: {
  items: InboxItem[];
  rules: MerchantRule[];
  usedCategories: string[];
}) {
  const ruleMap = new Map(rules.map((r) => [r.merchant, r]));
  const knownCount = items.filter((i) => i.merchant && ruleMap.get(i.merchant)?.category_text && i.amount).length;
  const categories = Array.from(new Set([...CATEGORY_OPTIONS, ...usedCategories]));

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-white">📥 待確認</h2>
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">{items.length} 筆</span>
            {knownCount > 0 && (
              <form action={acceptKnownInbox} className="ml-auto">
                <AcceptKnownButton count={knownCount} />
              </form>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {items.map((i) => (
              <InboxCard key={i.id} item={i} rule={i.merchant ? ruleMap.get(i.merchant) : undefined} categories={categories} />
            ))}
          </div>
        </div>
      )}
      <Link
        href="/auto-ledger"
        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      >
        <span>📱 付款通知自動記帳</span>
        <span aria-hidden>設定 ›</span>
      </Link>
    </div>
  );
}
