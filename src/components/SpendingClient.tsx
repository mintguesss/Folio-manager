"use client";

import { useMemo, useState } from "react";
import type { SpendItem } from "@/app/(app)/spending/page";
import { addFx, fmtFxBag, type FxBag } from "@/lib/currency";

const fmt = (n: number) => new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(Math.round(n));
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const BAR_COLORS = ["bg-rose-400", "bg-sky-400", "bg-emerald-400", "bg-violet-400", "bg-amber-400", "bg-orange-400", "bg-fuchsia-400", "bg-slate-400"];

function dayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${date.slice(5).replace("-", "/")}（${WEEK[d.getUTCDay()]}）`;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
}

function sumBy<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
    </div>
  );
}

export function SpendingClient({ items }: { items: SpendItem[] }) {
  // 行程依最近日期排，預設看最新一趟
  const trips = useMemo(() => {
    const latest = new Map<string, string>();
    for (const i of items) if ((latest.get(i.trip) ?? "") < i.date) latest.set(i.trip, i.date);
    return Array.from(latest.entries()).sort((a, b) => b[1].localeCompare(a[1])).map(([t]) => t);
  }, [items]);

  const [trip, setTrip] = useState<string>(trips[0] ?? "all");
  const [cat, setCat] = useState<string | null>(null);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());

  const inTrip = useMemo(() => (trip === "all" ? items : items.filter((i) => i.trip === trip)), [items, trip]);
  const mine = useMemo(() => inTrip.filter((i) => i.mineTwd > 0), [inTrip]);

  const total = mine.reduce((s, i) => s + i.mineTwd, 0);
  const totalFx = fmtFxBag(mine.reduce<FxBag>((b, i) => (i.currency === "TWD" ? b : addFx(b, i.currency, i.mineFx)), {}));
  const dates = mine.map((i) => i.date).sort();
  const days = dates.length > 0 ? daysBetween(dates[0], dates[dates.length - 1]) : 0;

  const byCat = sumBy(mine, (i) => i.category, (i) => i.mineTwd);
  const catColor = new Map(byCat.map(([c], idx) => [c, BAR_COLORS[idx % BAR_COLORS.length]]));
  const byDay = sumBy(mine, (i) => i.date, (i) => i.mineTwd).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(1, ...byDay.map(([, v]) => v));

  const payments = useMemo(() => {
    const m = new Map<string, { paid: number; forOthers: number; fx: FxBag }>();
    for (const i of inTrip) {
      if (!i.payment || i.paidTwd <= 0) continue;
      const row = m.get(i.payment) ?? { paid: 0, forOthers: 0, fx: {} };
      row.paid += i.paidTwd;
      row.forOthers += i.forOthersTwd;
      if (i.currency !== "TWD") addFx(row.fx, i.currency, i.paidFx);
      m.set(i.payment, row);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].paid - a[1].paid);
  }, [inTrip]);

  const detail = cat ? mine.filter((i) => i.category === cat) : mine;
  const detailByDay = useMemo(() => {
    const m = new Map<string, SpendItem[]>();
    for (const i of detail) m.set(i.date, [...(m.get(i.date) ?? []), i]);
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [detail]);

  function pickTrip(t: string) {
    setTrip(t);
    setCat(null);
    setOpenDays(new Set());
  }

  function toggleDay(d: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">還沒有出國記帳或出國分帳的資料。</p>;
  }

  return (
    <div className="space-y-5">
      {/* 選行程 */}
      <div className="flex flex-wrap gap-2">
        {[...trips, "all"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => pickTrip(t)}
            className={[
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              trip === t
                ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            ].join(" ")}
          >
            {t === "all" ? "全部行程" : t}
          </button>
        ))}
      </div>

      {/* 總額 */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <p className="text-xs text-zinc-400">{trip === "all" ? "所有出國" : trip}，我自己花了</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-rose-300">NT$ {fmt(total)}</p>
        {totalFx && <p className="mt-0.5 text-xs tabular-nums text-zinc-500">原幣 {totalFx}</p>}
        {trip !== "all" && days > 0 && (
          <p className="mt-3 text-sm text-zinc-300">
            {dates[0].replaceAll("-", "/")} – {dates[dates.length - 1].slice(5).replace("-", "/")}，共 {days} 天，
            平均每天 <span className="tabular-nums font-semibold">NT$ {fmt(total / days)}</span>
          </p>
        )}
        <p className="mt-3 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-zinc-500">
          ＝ 出國記帳 ＋ 分帳裡我分攤的部分。幫別人先付的錢不算在這裡（看下面「各付款方式」）。
        </p>
      </div>

      {/* 類別 */}
      <Section title="花在哪裡" hint="點類別可以只看那一類的明細">
        <div className="space-y-3">
          {byCat.map(([c, v]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(cat === c ? null : c)}
              className={["block w-full text-left transition-opacity", cat && cat !== c ? "opacity-40" : ""].join(" ")}
            >
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-zinc-200">{c}</span>
                <span className="tabular-nums text-zinc-300">
                  NT$ {fmt(v)} <span className="ml-1 text-xs text-zinc-500">{Math.round((v / total) * 100)}%</span>
                </span>
              </div>
              <Bar pct={(v / total) * 100} color={catColor.get(c)!} />
            </button>
          ))}
        </div>
      </Section>

      {/* 每天 */}
      {trip !== "all" && byDay.length > 1 && (
        <Section title="每天花多少">
          <div className="space-y-2.5">
            {byDay.map(([d, v]) => (
              <div key={d} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="text-xs tabular-nums text-zinc-400">{dayLabel(d)}</span>
                <Bar pct={(v / maxDay) * 100} color="bg-sky-400" />
                <span className="w-16 text-right tabular-nums text-zinc-300">{fmt(v)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 付款方式 */}
      {payments.length > 0 && (
        <Section title="各付款方式付了多少" hint="信用卡帳單上會看到的金額，包含幫別人先付的部分">
          <div className="divide-y divide-white/5">
            {payments.map(([p, r]) => (
              <div key={p} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-200">{p}</span>
                  <span className="tabular-nums text-sm font-semibold text-white">NT$ {fmt(r.paid)}</span>
                </div>
                {fmtFxBag(r.fx) && <p className="text-right text-xs tabular-nums text-zinc-500">{fmtFxBag(r.fx)}</p>}
                {r.forOthers > 0.5 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    其中幫別人先付 <span className="tabular-nums text-amber-300">NT$ {fmt(r.forOthers)}</span>（從分帳收回）
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 明細 */}
      <Section title={cat ? `明細：${cat}` : "明細"} hint={`${detail.length} 筆，點日期展開`}>
        {cat && (
          <button type="button" onClick={() => setCat(null)} className="-mt-2 mb-3 text-xs text-sky-400 hover:underline">
            看全部類別
          </button>
        )}
        <div className="overflow-hidden rounded-xl border border-white/10">
          {detailByDay.map(([d, rows], gi) => {
            const open = !!cat || openDays.has(d);
            return (
              <div key={d} className={gi > 0 ? "border-t border-white/5" : ""}>
                <button
                  type="button"
                  onClick={() => toggleDay(d)}
                  className="flex w-full items-center gap-3 bg-white/[0.04] px-3 py-2.5 text-left"
                >
                  <span className="flex-1 text-sm font-medium text-zinc-200">
                    {dayLabel(d)}
                    {trip === "all" && <span className="ml-2 text-xs text-zinc-500">{d.slice(0, 4)}</span>}
                  </span>
                  <span className="tabular-nums text-sm text-rose-300">{fmt(rows.reduce((s, i) => s + i.mineTwd, 0))}</span>
                  <span className="w-10 text-right text-xs text-zinc-500">{rows.length} 筆</span>
                </button>
                {open && (
                  <div className="divide-y divide-white/5">
                    {rows.map((i) => (
                      <div key={i.id} className="flex items-start gap-3 px-3 py-2.5">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${catColor.get(i.category)}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-zinc-200">{i.description}</p>
                          <p className="text-[11px] text-zinc-500">
                            {i.category}
                            {" · "}
                            {i.source === "split" ? (i.payment ? `分帳（我付 ${i.payment}）` : "分帳（別人付）") : i.payment}
                          </p>
                        </div>
                        <span className="shrink-0 tabular-nums text-sm text-zinc-200">{fmt(i.mineTwd)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
