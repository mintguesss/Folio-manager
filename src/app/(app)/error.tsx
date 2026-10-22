"use client";

import { useEffect } from "react";
import { isStaleDeploymentError, reloadOnce } from "@/components/StaleGuard";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // 新版部署後舊頁面的錯誤：直接重新載入拿新版
    if (isStaleDeploymentError(error)) reloadOnce();
    else console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-zinc-300">頁面出了點問題</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
        >
          再試一次
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
        >
          重新載入
        </button>
      </div>
    </div>
  );
}
