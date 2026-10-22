"use client";

import { useEffect } from "react";

/** 頁面在背景放超過這段時間，回來時直接重新載入 */
const IDLE_RELOAD_MS = 15 * 60 * 1000;
const RELOAD_GUARD_KEY = "stale-guard-reloaded-at";

/** 舊版頁面呼叫已不存在的 Server Action、或 JS 檔案已被新版取代 */
export function isStaleDeploymentError(err: unknown) {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? "");
  return /Server Action|ChunkLoadError|Loading chunk|Failed to load chunk/i.test(msg);
}

/** 重新載入一次；10 秒內不重複，避免錯誤一直存在時無限重整 */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {}
  window.location.reload();
  return true;
}

/**
 * 避免「放一陣子沒進去，功能就卡住要手動刷新」：
 * - 頁面在背景超過 15 分鐘再回來 → 自動重新載入（登入狀態與資料都是新的）
 * - 從瀏覽器快取（返回鍵 / PWA 從背景恢復）還原的頁面 → 重新載入
 * - 新版部署後舊頁面的按鈕失效 → 自動重新載入
 */
export function StaleGuard() {
  useEffect(() => {
    let hiddenAt: number | null = document.visibilityState === "hidden" ? Date.now() : null;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > IDLE_RELOAD_MS) reloadOnce();
      hiddenAt = null;
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isStaleDeploymentError(e.reason)) reloadOnce();
    };
    const onError = (e: ErrorEvent) => {
      if (isStaleDeploymentError(e.error ?? e.message)) reloadOnce();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
