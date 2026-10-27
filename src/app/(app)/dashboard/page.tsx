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

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500">其他</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MORE_NAV.map((item) => <Tile key={item.href} item={item} />)}
        </div>
      </div>
    </div>
  );
}
