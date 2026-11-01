"use client";

import { usePathname } from "next/navigation";

/** 換頁時的進場動畫（首頁有自己的動畫，不套） */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard") return children;
  return <div className="page-enter">{children}</div>;
}
