"use client";

import { useActionState } from "react";
import { backfillUSFxRates } from "@/app/actions/stocks";

type Result = { updated: number; failed: number } | undefined;

export function BackfillFxButton() {
  const [result, action, pending] = useActionState<Result, FormData>(
    async (_prev, _fd) => backfillUSFxRates(),
    undefined
  );

  return (
    <form action={action} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-400/20 transition-colors disabled:opacity-60"
      >
        {pending ? "補充中…" : "補充歷史匯率"}
      </button>
      {result != null && (
        <span className="text-xs text-zinc-400">
          {result.updated > 0 ? `已更新 ${result.updated} 筆` : ""}
          {result.failed > 0 ? `，${result.failed} 筆失敗` : ""}
          {result.updated === 0 && result.failed === 0 ? "無需補充" : ""}
        </span>
      )}
    </form>
  );
}
