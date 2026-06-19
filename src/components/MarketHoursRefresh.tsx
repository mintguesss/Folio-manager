"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isMarketHours } from "@/lib/market-hours";

export function MarketHoursRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (isMarketHours()) {
        router.refresh();
      }
    };
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
