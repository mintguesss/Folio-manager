"use client";

import { useActionState, useState } from "react";
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

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
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
            type="submit"
            formAction={ignoreInboxItem}
            formNoValidate
            className="ml-auto rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            不記
          </button>
        </div>
      </form>
      {showRaw && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-[11px] text-zinc-400">{item.raw_text}</p>}
    </div>
  );
}

function SetupPanel({ hasToken }: { hasToken: boolean }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/api/ingest?key=${token}` : "";

  async function generate() {
    setBusy(true);
    const r = await createIngestToken();
    setBusy(false);
    if (r.ok) setToken(r.token);
  }

  return (
    <details className="group rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        📱 手機通知自動記帳設定
        {hasToken && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">已設定</span>}
        <svg className="ml-auto h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      <div className="mt-4 space-y-4 text-sm text-zinc-300">
        <div>
          <p className="font-medium text-zinc-200">1. 產生手機專用網址</p>
          <p className="mt-1 text-xs text-zinc-500">
            網址裡有金鑰，只能用來「送通知進待確認區」，看不到你的帳。重新產生後舊的立刻失效。
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-white/10 disabled:opacity-60"
          >
            {busy ? "產生中…" : hasToken ? "重新產生" : "產生"}
          </button>
          {url && (
            <div className="mt-2 space-y-1.5">
              <p className="break-all rounded-lg bg-black/40 p-2 font-mono text-[11px] text-sky-300">{url}</p>
              <button
                type="button"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(url); setCopied(true); } catch {}
                }}
                className="text-xs text-sky-400 hover:underline"
              >
                {copied ? "已複製 ✓" : "複製網址"}
              </button>
              <p className="text-xs text-amber-300/80">這個網址只會顯示這一次，先貼到 MacroDroid。</p>
            </div>
          )}
        </div>

        <div>
          <p className="font-medium text-zinc-200">2. 在 Android 裝 MacroDroid，新增一個巨集</p>
          <ul className="mt-1 space-y-1 text-xs text-zinc-400">
            <li>• <b className="text-zinc-300">觸發條件</b>：通知 → 已收到通知 → 應用程式選 LINE（要記 LINE Pay App 的也一起勾）</li>
            <li>• 文字內容可設「包含」：<code className="text-zinc-300">消費|刷卡|付款|支付|扣款</code>（勾正規表達式），只轉帳務通知</li>
            <li>• <b className="text-zinc-300">動作</b>：連線 → HTTP 請求 → 方法 POST，網址貼上面那串</li>
            <li>• 內容類型選 <code className="text-zinc-300">application/x-www-form-urlencoded</code>，加兩個參數：</li>
            <li className="pl-3">
              <code className="text-zinc-300">title</code> = <code className="text-sky-300">[notification_title]</code>、
              <code className="text-zinc-300">text</code> = <code className="text-sky-300">[notification]</code>
            </li>
            <li>• 第一次會要你開「通知存取權」，允許就好</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-zinc-200">3. 之後</p>
          <p className="mt-1 text-xs text-zinc-400">
            刷卡 / LINE Pay 的通知會自動出現在上面的「待確認」。選好類別按入帳，這家店之後就會自動帶入類別；
            認得的店家可以一次全部入帳。抓不到金額的訊息（一般聊天）會直接丟掉，不會存。
          </p>
        </div>
      </div>
    </details>
  );
}

export function LedgerInbox({
  items,
  rules,
  hasToken,
  usedCategories,
}: {
  items: InboxItem[];
  rules: MerchantRule[];
  hasToken: boolean;
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
                <button type="submit" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20">
                  認得的 {knownCount} 筆直接入帳
                </button>
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
      <SetupPanel hasToken={hasToken} />
    </div>
  );
}
