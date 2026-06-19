"use client";

import { useState } from "react";

const CATEGORY_EMOJI: Record<string, string> = {
  食事: "🍜",
  住宿: "🏨",
  交通: "🚅",
  購物: "🛍",
  門票: "🎫",
  其他: "📦",
};

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}
function fmtJPY(n: number) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(n);
}

export function TravelSummaryAccordion({
  categoryTotals,
  totalJpy,
  totalTwd,
  count,
}: {
  categoryTotals: Record<string, { jpy: number; twd: number }>;
  totalJpy: number;
  totalTwd: number;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const cats = Object.entries(categoryTotals);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
      {/* Always-visible header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-5 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div>
          <div className="text-xs text-zinc-400">合計（JPY）</div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-white">
            ¥{fmtJPY(totalJpy)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">合計（TWD）</div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-400">
            {fmt(totalTwd)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <span>{count} 筆</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={[
              "h-4 w-4 text-zinc-500 transition-transform duration-200",
              open ? "rotate-180" : "",
            ].join(" ")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expandable category breakdown */}
      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map(([cat, { jpy, twd }]) => (
              <div
                key={cat}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="mb-1 text-base">{CATEGORY_EMOJI[cat] ?? "📦"}</div>
                <div className="text-xs text-zinc-400">{cat}</div>
                <div className="mt-1 text-sm font-semibold tabular-nums text-white">
                  ¥{fmtJPY(jpy)}
                </div>
                <div className="text-xs tabular-nums text-zinc-400">≈ {fmt(twd)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
