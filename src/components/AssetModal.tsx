"use client";

import { useState } from "react";
import { AssetForm } from "@/app/(app)/assets/AssetForm";

export function AssetModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        + 新增資產記帳
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">新增資產記帳</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="關閉"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <AssetForm onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
