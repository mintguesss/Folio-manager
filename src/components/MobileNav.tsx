"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_LINKS = [
  { href: "/dashboard", label: "總覽" },
  { href: "/networth", label: "資產記帳" },
  { href: "/stocks", label: "股票記帳" },
  { href: "/ledger", label: "一般記帳" },
  { href: "/travel", label: "出國記帳" },
  { href: "/split", label: "分帳" },
  { href: "/spending", label: "統計" },
];

export function MobileNav({ showTrip = false }: { showTrip?: boolean }) {
  const links = showTrip ? [...BASE_LINKS, { href: "/trip", label: "行程" }] : BASE_LINKS;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="開啟選單"
        className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10 transition-colors"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-white/10 bg-zinc-950/95 shadow-xl backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/5 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
