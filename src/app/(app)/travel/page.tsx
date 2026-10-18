import { createClient } from "@/lib/supabase/server";
import { TravelEntryForm } from "@/components/TravelEntryForm";
import { TravelSummaryAccordion } from "@/components/TravelSummaryAccordion";
import { TravelExpenseList } from "@/components/TravelExpenseList";
import { fetchTravelFx } from "@/lib/stock-utils";
import { addFx, toTravelCurrency, type FxBag, type TravelCurrency } from "@/lib/currency";
import Link from "next/link";

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const { trip: tripFilter } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rawExpenses }, { data: travelGroups }] = await Promise.all([
    supabase
      .from("travel_expenses")
      .select("id,trip_name,occurred_on,category,description,amount_jpy,currency,exchange_rate,payment_method,created_at")
      .eq("user_id", user?.id ?? "")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    // 出國分帳群組：名稱當行程名稱、帶出幣別
    supabase
      .from("split_groups")
      .select("name,currency")
      .eq("group_type", "travel")
      .order("created_at", { ascending: false }),
  ]);

  const expenses = (rawExpenses ?? []).map((e) => ({ ...e, currency: toTravelCurrency(e.currency) }));

  // 行程 → 幣別（記帳紀錄優先，其次是分帳群組設定）
  const tripCurrencies: Record<string, TravelCurrency> = {};
  for (const g of travelGroups ?? []) tripCurrencies[g.name] ??= toTravelCurrency(g.currency);
  for (const e of [...expenses].reverse()) {
    if (e.currency !== "TWD") tripCurrencies[e.trip_name] = e.currency;
  }

  const allTrips = Array.from(new Set(expenses.map((e) => e.trip_name))).sort();
  const tripOptions = Array.from(
    new Set([...allTrips, ...(travelGroups ?? []).map((g) => g.name)])
  ).sort();

  const defaultCurrency: TravelCurrency =
    (tripFilter && tripCurrencies[tripFilter]) ||
    (travelGroups?.[0] ? toTravelCurrency(travelGroups[0].currency) : undefined) ||
    expenses.find((e) => e.currency !== "TWD")?.currency ||
    "JPY";
  const serverRate = await fetchTravelFx(defaultCurrency);

  const filtered = tripFilter
    ? expenses.filter((e) => e.trip_name === tripFilter)
    : expenses;

  // Category summary for filtered view
  const categoryTotals: Record<string, { fx: FxBag; twd: number }> = {};
  const totalFx: FxBag = {};
  for (const e of filtered) {
    if (!categoryTotals[e.category]) categoryTotals[e.category] = { fx: {}, twd: 0 };
    addFx(categoryTotals[e.category].fx, e.currency, Number(e.amount_jpy));
    categoryTotals[e.category].twd += Math.round(Number(e.amount_jpy) * Number(e.exchange_rate));
    addFx(totalFx, e.currency, Number(e.amount_jpy));
  }
  const totalTwd = filtered.reduce(
    (s, e) => s + Math.round(Number(e.amount_jpy) * Number(e.exchange_rate)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">出國記帳</h1>
          <p className="mt-1 text-sm text-zinc-300">
            紀錄出國花費，即時換算台幣參考值。
          </p>
        </div>
        {tripFilter && (
          <Link
            href="/travel"
            className="mt-1 shrink-0 text-xs text-sky-400 hover:underline"
          >
            清除篩選
          </Link>
        )}
      </div>

      {/* Entry form */}
      <TravelEntryForm
        rate={serverRate}
        existingTrips={tripOptions}
        tripCurrencies={tripCurrencies}
        defaultTrip={tripFilter}
        defaultCurrency={defaultCurrency}
      />

      {/* Trip filter tabs */}
      {allTrips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/travel"
            className={[
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              !tripFilter
                ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            ].join(" ")}
          >
            全部
          </Link>
          {allTrips.map((t) => (
            <Link
              key={t}
              href={`/travel?trip=${encodeURIComponent(t)}`}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                tripFilter === t
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
              ].join(" ")}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Summary accordion (total always visible; category breakdown expandable) */}
      {filtered.length > 0 && (
        <TravelSummaryAccordion
          categoryTotals={categoryTotals}
          totalFx={totalFx}
          totalTwd={totalTwd}
          count={filtered.length}
        />
      )}

      {/* Expense list */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <h2 className="mb-4 text-sm font-semibold text-white">
          {tripFilter ? `${tripFilter} 的支出明細` : "所有支出明細"}
        </h2>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">尚無紀錄，開始新增支出吧。</p>
        ) : (
          <TravelExpenseList expenses={filtered} />
        )}
      </div>
    </div>
  );
}
