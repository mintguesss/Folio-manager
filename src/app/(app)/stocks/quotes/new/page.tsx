"use client";

import Link from "next/link";
import { useActionState } from "react";
import { upsertQuote } from "@/app/actions/quotes";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

export default function NewQuotePage() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      return await upsertQuote(formData);
    },
    undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">新增手動報價</h1>
          <p className="mt-1 text-sm text-zinc-300">同一天同一檔會覆寫。</p>
        </div>
        <Link href="/stocks/quotes" className="text-sm font-medium text-zinc-200 hover:underline">
          返回報價列表
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">市場</span>
            <select
              name="market"
              defaultValue="TW"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            >
              <option value="TW">台股</option>
              <option value="US">美股</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">日期</span>
            <input
              name="quote_date"
              type="date"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">代號</span>
            <input
              name="symbol"
              placeholder="2330 / AAPL"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">收盤價</span>
            <input
              name="close"
              type="number"
              step="0.0001"
              min="0"
              required
              defaultValue={0}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-zinc-200/90">幣別</span>
            <input
              name="currency"
              defaultValue="TWD"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <div className="sm:col-span-2">
            {state?.message ? (
              <p className={["mb-2 text-sm", state.ok ? "text-emerald-700" : "text-red-700"].join(" ")}>
                {state.message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "儲存中…" : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

