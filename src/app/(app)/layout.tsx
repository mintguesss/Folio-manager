import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { MAIN_NAV, TRIP_NAV, canSeeTrip } from "@/lib/nav";
import { signOut } from "@/app/actions/auth";
import { MobileNav } from "@/components/MobileNav";
import { StaleGuard } from "@/components/StaleGuard";
import { MoreMenu } from "@/components/MoreMenu";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-200/90 hover:bg-white/5 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const showTrip = canSeeTrip(user?.email);
  const mainNav = showTrip ? [...MAIN_NAV, TRIP_NAV] : MAIN_NAV;

  return (
    <div className="min-h-screen">
      <StaleGuard />
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-wide text-white"
          >
            Folio Manager
          </Link>

          {/* Nav — centered */}
          <div className="hidden items-center justify-center gap-1 sm:flex">
            {mainNav.map((i) => <NavLink key={i.href} href={i.href} label={i.label} />)}
            <MoreMenu />
          </div>

          {/* Right side */}
          <div className="flex items-center justify-end gap-3">
            {user?.email ? (
              <span className="hidden text-xs text-zinc-300 sm:inline">
                {user.email}
              </span>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
              >
                登出
              </button>
            </form>
            <MobileNav showTrip={showTrip} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
