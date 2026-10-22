import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { MobileNav } from "@/components/MobileNav";
import { StaleGuard } from "@/components/StaleGuard";

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
  const supabase = await createClient();
  const user = await getUser();

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
            <NavLink href="/dashboard" label="總覽" />
            <NavLink href="/networth" label="資產記帳" />
            <NavLink href="/stocks" label="股票記帳" />
            <NavLink href="/ledger" label="一般記帳" />
            <NavLink href="/travel" label="出國記帳" />
            <NavLink href="/split" label="分帳" />
            <NavLink href="/spending" label="統計" />
            {["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"].includes(user?.email ?? "") && (
              <NavLink href="/trip" label="行程" />
            )}
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
            <MobileNav showTrip={["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"].includes(user?.email ?? "")} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
