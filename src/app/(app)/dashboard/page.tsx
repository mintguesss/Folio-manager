import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { MAIN_NAV, MORE_NAV, TRIP_NAV, canSeeTrip, type NavItem } from "@/lib/nav";

function Tile({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur transition-colors hover:bg-black/40 active:bg-white/5"
    >
      <span className="text-2xl">{item.emoji}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{item.label}</span>
        <span className="block truncate text-xs text-zinc-500">{item.desc}</span>
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const user = await getUser();
  const main = canSeeTrip(user?.email) ? [...MAIN_NAV, TRIP_NAV] : MAIN_NAV;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-white">要記什麼？</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {main.map((item) => <Tile key={item.href} item={item} />)}
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-zinc-500 [&::-webkit-details-marker]:hidden">
          其他
          <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MORE_NAV.map((item) => <Tile key={item.href} item={item} />)}
        </div>
      </details>
    </div>
  );
}
