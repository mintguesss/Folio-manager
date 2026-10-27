"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MORE_NAV } from "@/lib/nav";

/** 桌面版選單的「其他」下拉 */
export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = MORE_NAV.some((i) => pathname.startsWith(i.href));

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
          active ? "text-white" : "text-zinc-200/90",
        ].join(" ")}
      >
        其他
        <svg className={["h-3.5 w-3.5 transition-transform", open ? "rotate-180" : ""].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-xl backdrop-blur">
          {MORE_NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
            >
              {i.emoji} {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
