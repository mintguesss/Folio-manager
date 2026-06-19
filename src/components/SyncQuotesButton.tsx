"use client";

import { useFormStatus } from "react-dom";

function Inner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20 transition-colors disabled:opacity-60"
    >
      {pending ? "抓取中…" : "抓取股價"}
    </button>
  );
}

export function SyncQuotesButton() {
  return <Inner />;
}
