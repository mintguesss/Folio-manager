"use client";

import { useState, useSyncExternalStore } from "react";
import { createIngestToken } from "@/app/actions/ledger";

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

export function AutoLedgerPanel() {
  // 回傳字串才能比對有沒有變；空字串代表不在 App 裡
  const raw = useSyncExternalStore(subscribeApp, () => appBridge()?.getState() ?? "", () => "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string | null>(null);

  if (!raw) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
        <p className="text-sm font-semibold text-white">📱 付款通知自動記帳</p>
        <p className="mt-0.5 text-xs text-zinc-400">
          只有 Android App 支援，iPhone 和電腦用不了。裝好後開啟 App、登入，開關會出現在這裡。
        </p>
        <a
          href="/Folio.apk"
          download
          className="mt-3 inline-block rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white"
        >
          下載 Android App
        </a>
      </div>
    );
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
          className={["relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60", on ? "border-sky-500/40 bg-sky-950" : "border-white/10 bg-zinc-900"].join(" ")}
        >
          <span className={["absolute left-[3px] top-[3px] h-5 w-5 rounded-full transition-transform", on ? "translate-x-5 bg-sky-400" : "bg-zinc-600"].join(" ")} />
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
