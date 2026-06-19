"use client";

import { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SplitShare, SplitExpense } from "@/app/(app)/spending/page";

type TravelExpense = {
  id: string;
  occurred_on: string;
  amount_jpy: number;
  exchange_rate: number | null;
  payment_method: string | null;
  category: string | null;
  description: string | null;
  split_expense_id: string | null;
};

type UnifiedExpense = {
  id: string;
  date: string;
  my_share_twd: number;
  my_share_jpy: number;
  total_paid_twd: number;
  source: "travel" | "split";
  category: string;
  payment_method: string;
  description: string;
  is_split_payer: boolean;
  is_uploaded: boolean;
  is_settled: boolean;
};

const SOURCE_LABELS = { travel: "出國記帳", split: "分帳" } as const;
const COLORS = ["#fb7185","#38bdf8","#34d399","#a78bfa","#fbbf24","#f97316","#e879f9","#94a3b8"];

const fmt = (n: number) =>
  new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);

const fmtJPY = (n: number) =>
  new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(n);

function normalize(
  travelExpenses: TravelExpense[],
  splitShares: SplitShare[],
  splitExpenses: SplitExpense[],
  uploadedSplitIds: Set<string>,
  memberIds: string[]
): UnifiedExpense[] {
  const memberIdSet = new Set(memberIds);
  const result: UnifiedExpense[] = [];
  const sharesByExpenseId = new Map<string, SplitShare[]>();
  for (const s of splitShares) {
    const arr = sharesByExpenseId.get(s.expense_id) ?? [];
    arr.push(s);
    sharesByExpenseId.set(s.expense_id, arr);
  }

  const expenseMap = new Map(splitExpenses.map((e) => [e.id, e]));

  // ── Travel expenses — all are the user's own spending ────────────
  for (const e of travelExpenses) {
    const rate = Number(e.exchange_rate ?? 0.217);
    const twd = Number(e.amount_jpy) * rate;
    result.push({
      id: `t-${e.id}`,
      date: e.occurred_on,
      my_share_twd: twd,
      my_share_jpy: Number(e.amount_jpy),
      total_paid_twd: twd,
      source: "travel",
      category: e.category?.trim() || "其他",
      payment_method: e.payment_method?.trim() || "未分類",
      description: e.description?.trim() || e.category?.trim() || "支出",
      is_split_payer: false,
      is_uploaded: false,
      is_settled: false,
    });
  }

  // ── Split expenses (iterate by expense, not by share) ────────────
  for (const exp of splitExpenses) {
    const allShares = sharesByExpenseId.get(exp.id) ?? [];
    const userShares = allShares.filter((s) => memberIdSet.has(s.member_id));
    if (userShares.length === 0) continue; // user has no stake in this expense

    const rate = Number(exp.exchange_rate ?? 0.217);
    const toTWD = (amt: number) => (exp.currency === "JPY" ? amt * rate : amt);

    const my_share_twd = userShares.reduce((sum, s) => sum + toTWD(Number(s.share_amount)), 0);
    const is_payer = memberIdSet.has(exp.paid_by);
    const total_paid_twd = is_payer ? toTWD(Number(exp.amount)) : my_share_twd;
    const is_uploaded = uploadedSplitIds.has(exp.id);

    const my_share_jpy = exp.currency === "JPY"
      ? userShares.reduce((sum, s) => sum + Number(s.share_amount), 0)
      : 0;
    const is_settled = userShares.every((s) => s.is_settled);
    result.push({
      id: `s-${userShares[0].id}`,
      date: exp.expense_date,
      my_share_twd,
      my_share_jpy,
      total_paid_twd,
      source: "split",
      category: (exp.category || exp.category_text)?.trim() || "其他",
      payment_method: is_payer ? ((exp.payment_method || exp.account)?.trim() || "未分類") : "分帳",
      description: exp.description?.trim() || "分帳支出",
      is_split_payer: is_payer,
      is_uploaded,
      is_settled,
    });
  }

  return result.sort((a, b) => (b.date > a.date ? 1 : -1));
}

// ── Detail list with date grouping + accordion ───────────────────

function EntryRow({ e, isOpen, onToggle }: { e: UnifiedExpense; isOpen: boolean; onToggle: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
      >
        <span className={["flex-1 truncate text-sm", (e.is_uploaded || e.is_settled) ? "text-zinc-500" : "text-zinc-200"].join(" ")}>
          {e.description}
        </span>
        {e.is_uploaded && (
          <span className="shrink-0 rounded-md bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            已上傳
          </span>
        )}
        {e.is_settled && !e.is_uploaded && (
          <span className="shrink-0 rounded-md bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            已結清
          </span>
        )}
        <span className={["shrink-0 tabular-nums text-sm font-semibold",
          e.is_uploaded ? "text-zinc-600" : e.is_settled ? "text-zinc-500" : "text-rose-300"
        ].join(" ")}>
          -{fmt(e.my_share_twd)}
        </span>
        <svg
          className={["h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200", isOpen ? "rotate-180" : ""].join(" ")}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-white/5 bg-white/[0.015] px-3 pb-3 pt-2.5">
          <div className="flex flex-wrap gap-x-8 gap-y-1.5 text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500">來源</span>
              <span className="text-zinc-300">{SOURCE_LABELS[e.source]}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500">類別</span>
              <span className="text-zinc-300">{e.category}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500">支付方式</span>
              <span className="text-zinc-300">{e.payment_method}</span>
            </div>
            {e.is_uploaded && (
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500">備註</span>
                <span className="text-zinc-400">已上傳至出國記帳</span>
              </div>
            )}
            {e.is_settled && !e.is_uploaded && (
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-500">備註</span>
                <span className="text-zinc-400">已結清</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailList({ entries }: { entries: UnifiedExpense[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, UnifiedExpense[]>();
    for (const e of entries) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleDate = useCallback((date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  }, []);

  const toggleEntry = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {grouped.map(([date, dateEntries], gi) => {
        const isCollapsed = collapsedDates.has(date);
        const dayTotal = dateEntries.filter(e => !e.is_uploaded).reduce((s, e) => s + e.my_share_twd, 0);
        return (
          <div key={date} className={gi > 0 ? "border-t border-white/5" : ""}>
            <button
              type="button"
              onClick={() => toggleDate(date)}
              className="flex w-full items-center gap-3 bg-white/[0.05] px-3 py-3 text-left"
            >
              <span className="flex-1 text-sm font-semibold text-zinc-200">{date}</span>
              <span className="tabular-nums text-sm font-medium text-rose-300">{dayTotal > 0 ? `-${fmt(dayTotal)}` : ""}</span>
              <span className="text-xs text-zinc-400">{dateEntries.length} 筆</span>
              <svg
                className={["h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", isCollapsed ? "" : "rotate-180"].join(" ")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-white/5">
                {dateEntries.map((e) => (
                  <EntryRow key={e.id} e={e} isOpen={openId === e.id} onToggle={() => toggleEntry(e.id)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

type ReconcileEntry = {
  id: string; date: string; description: string; pm: string;
  amount: number; my: number; forOthers: number; source: "travel" | "split";
  amount_jpy: number; my_jpy: number;
};

function ReconcileList({ entries }: { entries: ReconcileEntry[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, ReconcileEntry[]>();
    for (const e of entries) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const toggleDate = useCallback((date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {grouped.map(([date, dateEntries], gi) => {
        const isCollapsed = collapsedDates.has(date);
        const dayTotal = dateEntries.reduce((s, e) => s + e.amount, 0);
        const dayTotalJPY = dateEntries.reduce((s, e) => s + e.amount_jpy, 0);
        return (
          <div key={date} className={gi > 0 ? "border-t border-white/5" : ""}>
            <button
              type="button"
              onClick={() => toggleDate(date)}
              className="flex w-full items-center gap-3 bg-white/[0.05] px-3 py-3 text-left"
            >
              <span className="flex-1 text-sm font-semibold text-zinc-200">{date}</span>
              <div className="text-right">
                <p className="tabular-nums text-sm font-medium text-rose-300">-{fmt(dayTotal)}</p>
                {dayTotalJPY > 0.5 && <p className="tabular-nums text-xs text-zinc-600">¥{fmtJPY(dayTotalJPY)}</p>}
              </div>
              <span className="text-xs text-zinc-400">{dateEntries.length} 筆</span>
              <svg
                className={["h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", isCollapsed ? "" : "rotate-180"].join(" ")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-white/5">
                {dateEntries.map((e) => (
                  <div key={e.id} className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-zinc-200">{e.description}</span>
                          <span className={["shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                            e.source === "travel" ? "bg-sky-500/15 text-sky-400" : "bg-violet-500/15 text-violet-400"
                          ].join(" ")}>
                            {e.source === "travel" ? "出國記帳" : "分帳"}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-500">
                          <span>{e.pm}</span>
                          {e.forOthers > 0.5 && (
                            <span>代墊 <span className="tabular-nums text-amber-300">{fmt(e.forOthers)}</span></span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular-nums text-sm font-semibold text-rose-300">-{fmt(e.amount)}</p>
                        {e.amount_jpy > 0.5 && <p className="tabular-nums text-xs text-zinc-600">¥{fmtJPY(e.amount_jpy)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SpendingClient({
  travelExpenses,
  splitShares,
  splitExpenses,
  uploadedSplitIds,
  memberIds,
  isOwner = false,
}: {
  travelExpenses: TravelExpense[];
  splitShares: SplitShare[];
  splitExpenses: SplitExpense[];
  uploadedSplitIds: string[];
  memberIds: string[];
  isOwner?: boolean;
}) {
  const uploadedSet = useMemo(() => new Set(uploadedSplitIds), [uploadedSplitIds]);

  const all = useMemo(
    () => normalize(travelExpenses, splitShares, splitExpenses, uploadedSet, memberIds),
    [travelExpenses, splitShares, splitExpenses, uploadedSet, memberIds]
  );

  const months = useMemo(() => {
    const s = new Set(all.map((e) => e.date.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [all]);

  const paymentMethods = useMemo(() => {
    const s = new Set(all.map((e) => e.payment_method));
    return Array.from(s).sort();
  }, [all]);

  const categories = useMemo(() => {
    const s = new Set(all.map((e) => e.category));
    return Array.from(s).sort();
  }, [all]);

  const [month, setMonth] = useState<string>("all");
  const [source, setSource] = useState<"all" | keyof typeof SOURCE_LABELS | "reconcile">("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  // ── 對帳資料（isOwner only） ─────────────────────────────────
  const reconcileEntries = useMemo((): ReconcileEntry[] => {
    if (!isOwner) return [];
    const memberIdSet = new Set(memberIds);
    const sharesByExpId = new Map<string, SplitShare[]>();
    for (const s of splitShares) {
      const arr = sharesByExpId.get(s.expense_id) ?? [];
      arr.push(s);
      sharesByExpId.set(s.expense_id, arr);
    }
    const result: ReconcileEntry[] = [];
    for (const e of travelExpenses) {
      if (e.split_expense_id) continue;
      const pm = e.payment_method?.trim() || "其他";
      const rate = Number(e.exchange_rate ?? 0.217);
      const amount = Number(e.amount_jpy) * rate;
      result.push({ id: `t-${e.id}`, date: e.occurred_on, description: e.description?.trim() || e.category?.trim() || "支出", pm, amount, my: amount, forOthers: 0, source: "travel", amount_jpy: Number(e.amount_jpy), my_jpy: Number(e.amount_jpy) });
    }
    for (const exp of splitExpenses) {
      if (!memberIdSet.has(exp.paid_by)) continue;
      const pm = (exp.payment_method || exp.account)?.trim() || "其他";
      const shares = sharesByExpId.get(exp.id) ?? [];
      const userShares = shares.filter(s => memberIdSet.has(s.member_id));
      const rate = Number(exp.exchange_rate ?? 0.217);
      const toTWD = (amt: number) => exp.currency === "JPY" ? amt * rate : amt;
      const my = userShares.reduce((sum, s) => sum + toTWD(Number(s.share_amount)), 0);
      const total = toTWD(Number(exp.amount));
      const isJpy = exp.currency === "JPY";
      const amount_jpy = isJpy ? Number(exp.amount) : 0;
      const my_jpy = isJpy ? userShares.reduce((sum, s) => sum + Number(s.share_amount), 0) : 0;
      result.push({ id: `s-${exp.id}`, date: exp.expense_date, description: exp.description?.trim() || "分帳支出", pm, amount: total, my, forOthers: total - my, source: "split", amount_jpy, my_jpy });
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [isOwner, travelExpenses, splitExpenses, splitShares, memberIds]);

  const filteredReconcile = useMemo(() =>
    reconcileEntries.filter(e =>
      (month === "all" || e.date.startsWith(month)) &&
      (paymentMethod === "all" || e.pm === paymentMethod)
    ),
    [reconcileEntries, month, paymentMethod]
  );

  const reconcileSummary = useMemo(() => {
    const m = new Map<string, { amount: number; my: number; forOthers: number; amount_jpy: number; my_jpy: number }>();
    for (const e of filteredReconcile) {
      const row = m.get(e.pm) ?? { amount: 0, my: 0, forOthers: 0, amount_jpy: 0, my_jpy: 0 };
      row.amount += e.amount; row.my += e.my; row.forOthers += e.forOthers;
      row.amount_jpy += e.amount_jpy; row.my_jpy += e.my_jpy;
      m.set(e.pm, row);
    }
    return Array.from(m.entries()).map(([pm, v]) => ({ pm, ...v })).sort((a, b) => b.amount - a.amount);
  }, [filteredReconcile]);

  const reconcilePms = useMemo(() => {
    const s = new Set(reconcileEntries.map(e => e.pm));
    return Array.from(s).sort();
  }, [reconcileEntries]);

  const filtered = useMemo(
    () =>
      all.filter(
        (e) =>
          (month === "all" || e.date.startsWith(month)) &&
          (source === "all" || e.source === source) &&
          (paymentMethod === "all" || e.payment_method === paymentMethod) &&
          (category === "all" || e.category === category)
      ),
    [all, month, source, paymentMethod, category]
  );

  // When viewing "all" sources, exclude uploaded split entries to avoid double-counting
  // with travel_expenses (which already has the user's share). When viewing split only,
  // show full amounts so the user can see what they paid.
  const excludeUploaded = source === "all";

  const totalMy = useMemo(
    () => filtered.filter(e => !excludeUploaded || !e.is_uploaded).reduce((s, e) => s + e.my_share_twd, 0),
    [filtered, excludeUploaded]
  );

  const totalMyJPY = useMemo(
    () => filtered.filter(e => !excludeUploaded || !e.is_uploaded).reduce((s, e) => s + e.my_share_jpy, 0),
    [filtered, excludeUploaded]
  );

  const bySource = useMemo(() => {
    const m = { travel: 0, split: 0 };
    for (const e of filtered) {
      if (!excludeUploaded || !e.is_uploaded) m[e.source] += e.my_share_twd;
    }
    return m;
  }, [filtered, excludeUploaded]);

  // 代墊明細 — computed directly from raw split data (independent of source filter)
  const splitFronted = useMemo(() => {
    if (source === "travel") return [];
    const memberIdSet = new Set(memberIds);
    const sharesByExpId = new Map<string, SplitShare[]>();
    for (const s of splitShares) {
      const arr = sharesByExpId.get(s.expense_id) ?? [];
      arr.push(s);
      sharesByExpId.set(s.expense_id, arr);
    }
    const m = new Map<string, { my: number; forOthers: number; total: number }>();
    for (const exp of splitExpenses) {
      if (month !== "all" && !exp.expense_date.startsWith(month)) continue;
      const cat = (exp.category || exp.category_text)?.trim() || "其他";
      if (category !== "all" && cat !== category) continue;
      const pm = (exp.payment_method || exp.account)?.trim() || "未分類";
      if (paymentMethod !== "all" && pm !== paymentMethod) continue;

      const allShares = sharesByExpId.get(exp.id) ?? [];
      const userShares = allShares.filter((s) => memberIdSet.has(s.member_id));
      if (userShares.length === 0) continue;
      if (!memberIdSet.has(exp.paid_by)) continue; // user is not payer

      const rate = Number(exp.exchange_rate ?? 0.217);
      const toTWD = (amt: number) => (exp.currency === "JPY" ? amt * rate : amt);
      const my = userShares.reduce((sum, s) => sum + toTWD(Number(s.share_amount)), 0);
      const total = toTWD(Number(exp.amount));
      const forOthers = total - my;
      if (forOthers <= 0.01) continue;

      const row = m.get(pm) ?? { my: 0, forOthers: 0, total: 0 };
      row.my += my;
      row.forOthers += forOthers;
      row.total += total;
      m.set(pm, row);
    }
    return Array.from(m.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [source, splitExpenses, splitShares, memberIds, month, category, paymentMethod]);

  const categoryData = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) m.set(e.category, (m.get(e.category) ?? 0) + e.my_share_twd);
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
        >
          <option value="all">全部月份</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <div className="flex flex-wrap gap-1">
          {(["all", "travel", "split"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                source === s
                  ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              ].join(" ")}
            >
              {s === "all" ? "全部來源" : SOURCE_LABELS[s]}
            </button>
          ))}
          {isOwner && (
            <button
              onClick={() => setSource("reconcile")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                source === "reconcile"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "border border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15",
              ].join(" ")}
            >
              💳 對帳
            </button>
          )}
        </div>
      </div>

      {source !== "reconcile" ? (
        <>
          <div className="flex flex-wrap gap-3">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部支付方式</option>
              {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部類別</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 backdrop-blur">
              <p className="text-xs text-zinc-400">總支出</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-300">{fmt(totalMy)}</p>
              <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                {fmt(totalMy)} TWD · {filtered.length} 筆{source === "split" ? "（含已上傳）" : ""}
              </p>
              {totalMyJPY > 0 && <p className="text-xs tabular-nums text-zinc-600">¥{fmtJPY(totalMyJPY)}</p>}
            </div>
            {source === "split" ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                  <p className="text-xs text-zinc-400">未上傳</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-200">
                    {fmt(filtered.filter(e => !e.is_uploaded).reduce((s, e) => s + e.my_share_twd, 0))}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">TWD</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                  <p className="text-xs text-zinc-400">已上傳</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-200">
                    {fmt(filtered.filter(e => e.is_uploaded).reduce((s, e) => s + e.my_share_twd, 0))}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">TWD</p>
                </div>
              </>
            ) : (
              (["travel", "split"] as const).map((s) => (
                <div key={s} className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                  <p className="text-xs text-zinc-400">{SOURCE_LABELS[s]}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-200">{fmt(bySource[s])}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">TWD</p>
                </div>
              ))
            )}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-64 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
              <h2 className="mb-2 text-sm font-semibold text-white">支出分類</h2>
              {categoryData.length === 0 ? (
                <div className="flex h-[85%] items-center justify-center text-sm text-zinc-500">無資料</div>
              ) : (
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="35%" outerRadius="58%" paddingAngle={2}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(v as number)}
                      contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(229,231,235,0.95)", fontSize: 12 }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: "rgba(229,231,235,0.75)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {source !== "travel" && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                <div className="mb-4 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-white">代墊明細</h2>
                  {splitFronted.length > 0 && (
                    <span className="text-xs text-zinc-500">
                      幫別人付合計 <span className="tabular-nums text-amber-300">{fmt(splitFronted.reduce((s, p) => s + p.forOthers, 0))}</span>
                    </span>
                  )}
                </div>
                {splitFronted.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-zinc-500">無代墊紀錄</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {splitFronted.map((p) => (
                      <div key={p.method} className="py-3 first:pt-0 last:pb-0">
                        <div className="mb-2 flex items-baseline justify-between text-xs">
                          <span className="font-medium text-zinc-300">{p.method}</span>
                          <span className="tabular-nums font-semibold text-zinc-200">{fmt(p.total)}</span>
                        </div>
                        <div className="mb-1.5 flex gap-4 text-[11px]">
                          <span className="text-zinc-500">我自己 <span className="tabular-nums text-sky-300">{fmt(p.my)}</span></span>
                          <span className="text-zinc-500">幫別人刷 <span className="tabular-nums text-amber-300">{fmt(p.forOthers)}</span></span>
                        </div>
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full bg-emerald-500" style={{ width: `${(p.my / p.total) * 100}%` }} />
                          <div className="h-full bg-amber-500" style={{ width: `${(p.forOthers / p.total) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Detail list ── */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">明細</h2>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">{filtered.length} 筆</span>
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">無符合條件的支出</p>
            ) : (
              <DetailList entries={filtered} />
            )}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          {/* ── Reconcile filters ── */}
          <div className="flex flex-wrap gap-3">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部支付方式</option>
              {reconcilePms.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* ── Summary by payment method ── */}
          {reconcileSummary.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">刷卡總覽</h2>
              <div className="space-y-3">
                {reconcileSummary.map(row => (
                  <div key={row.pm} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-zinc-200">{row.pm}</span>
                      <div className="text-right">
                        <p className="tabular-nums text-sm font-bold text-rose-300">合計 {fmt(row.amount)}</p>
                        {row.amount_jpy > 0.5 && <p className="tabular-nums text-xs text-zinc-500">¥{fmtJPY(row.amount_jpy)}</p>}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                      <span>自己 <span className="tabular-nums text-sky-300">{fmt(row.my)}</span>{row.my_jpy > 0.5 && <span className="ml-1 text-zinc-600">¥{fmtJPY(row.my_jpy)}</span>}</span>
                      {row.forOthers > 0.5 && (
                        <span>代墊 <span className="tabular-nums text-amber-300">{fmt(row.forOthers)}</span></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-transaction list ── */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">明細</h2>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">{filteredReconcile.length} 筆</span>
            </div>
            {filteredReconcile.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">無符合條件的支出</p>
            ) : (
              <ReconcileList entries={filteredReconcile} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
