"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
    >
      {pending ? "刪除中…" : "刪除"}
    </button>
  );
}
