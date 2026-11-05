"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Combobox } from "@/components/Combobox";
import { acceptInboxItem, acceptKnownInbox, createIngestToken, ignoreInboxItem } from "@/app/actions/ledger";
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

/** App 外殼提供的介面（只有 Android App 裡才有） */
type FolioAppBridge = {
  getState(): string;
  setKey(key: string): void;
  setEnabled(enabled: boolean): void;
  openAccessSettings(): void;
  getLog(): string;
};
type AppState = { access: boolean; enabled: boolean; configured: boolean };

const appBridge = () => (window as unknown as { FolioApp?: FolioAppBridge }).FolioApp;

function subscribeApp(onChange: () => void) {
  window.addEventListener("folio-app-state", onChange);
  return () => window.removeEventListener("folio-app-state", onChange);
}

function AutoLedgerPanel() {
  // 回傳字串才能比對有沒有變；空字串代表不在 App 裡
  const raw = useSyncExternalStore(subscribeApp, () => appBridge()?.getState() ?? "", () => "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string | null>(null);

  if (!raw) {
    return <p className="px-1 text-xs text-zinc-500">📱 付款通知自動記帳只有 Android App 支援，iPhone 和電腦用不了。</p>;
  }

  const state = JSON.parse(raw) as AppState;
  const on = state.enabled && state.configured;
  const refresh = () => window.dispatchEvent(new Event("folio-app-state"));

  async function toggle() {
    const app = appBridge();
    if (!app) return;
    setError("");
    if (on) {
      app.setEnabled(false);
      refresh();
      return;
    }
    if (!state.configured) {
      setBusy(true);
      const r = await createIngestToken();
      setBusy(false);
      if (!r.ok) {
        setError("開啟失敗，請再試一次。");
        return;
      }
      app.setKey(r.token);
    }
    app.setEnabled(true);
    refresh();
    if (!state.access) app.openAccessSettings();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">📱 付款通知自動記帳</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {!on ? "已關閉，不會送出任何通知。" : state.access ? "自動記帳中，付款通知會進「待確認」。" : "還差通知存取權才會開始。"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="付款通知自動記帳"
          disabled={busy}
          onClick={toggle}
          className={["relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-sky-500" : "bg-white/15"].join(" ")}
        >
          <span className={["absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform", on ? "translate-x-5" : ""].join(" ")} />
        </button>
      </div>
      {on && !state.access && (
        <button
          type="button"
          onClick={() => appBridge()?.openAccessSettings()}
          className="mt-3 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/25"
        >
          開啟通知存取權
        </button>
      )}
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      <button
        type="button"
        onClick={() => setLog(log === null ? (appBridge()?.getLog() ?? "") : null)}
        className="mt-3 block text-xs text-zinc-500 hover:text-zinc-300"
      >
        {log === null ? "看最近紀錄" : "收起紀錄"}
      </button>
      {log !== null && (
        <p className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/30 p-2 text-[11px] text-zinc-400">
          {log || "還沒有紀錄。"}
        </p>
      )}
    </div>
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
      <AutoLedgerPanel />
    </div>
  );
}
