"use client";

// ── Helpers ───────────────────────────────────────────────────

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-sky-400 hover:text-sky-300 transition-colors hover:underline underline-offset-2">
      {children}
    </a>
  );
}

/** Google Maps 搜尋連結 */
export function M({ q, children }: { q: string; children: React.ReactNode }) {
  return <A href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}>{children}</A>;
}

export function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 text-base leading-none ${done ? "text-emerald-400" : "text-zinc-600"}`}>
        {done ? "✓" : "○"}
      </span>
      <span className={`text-base leading-relaxed ${done ? "text-zinc-500 line-through decoration-zinc-600" : "text-zinc-200"}`}>
        {children}
      </span>
    </div>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
      <span className="text-base leading-relaxed text-zinc-300">{children}</span>
    </div>
  );
}

export function TimedItem({ time, children }: { time: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-sky-300 whitespace-nowrap">
        {time}
      </span>
      <span className="text-base leading-relaxed text-zinc-300">{children}</span>
    </div>
  );
}

export function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-2 pb-0.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
      {children}
    </p>
  );
}

export function DayHeader({ day, date, title }: { day: number; date: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-white/8 pb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-bold text-white shadow-lg">
        {day}
      </div>
      <div>
        <p className="text-xs text-zinc-500">{date}</p>
        <p className="text-lg font-semibold text-white">{title}</p>
      </div>
    </div>
  );
}

export function LocHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-3 first:pt-0">
      <span className="text-lg">📍</span>
      <span className="text-lg font-bold text-white">{children}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ── Layout pieces ─────────────────────────────────────────────

export function TripHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-violet-500/10 backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-violet-500" />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
            >
              {action.label}
            </button>
          )}
        </div>
        <div className="mt-2.5 space-y-1 text-base text-zinc-300">{children}</div>
      </div>
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; top: string; bottom: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "shrink-0 rounded-2xl px-3.5 py-2 text-center transition-all",
              isActive
                ? "bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-900/30"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
            ].join(" ")}
          >
            <div className="text-sm font-semibold">{tab.top}</div>
            <div className={`text-xs ${isActive ? "text-white/70" : "text-zinc-500"}`}>{tab.bottom}</div>
          </button>
        );
      })}
    </div>
  );
}

export function FilterPills<T extends string>({
  filters,
  active,
  onChange,
}: {
  filters: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={[
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === f.id
              ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white"
              : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
          ].join(" ")}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
