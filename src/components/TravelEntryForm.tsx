"use client";

import Link from "next/link";
import { useActionState, useState, useEffect, useRef } from "react";
import { createTravelExpense, updateTravelExpense } from "@/app/actions/travel";
import { Combobox } from "@/components/Combobox";
import { CURRENCY_INFO, TRAVEL_CURRENCIES, roundFx, type TravelCurrency } from "@/lib/currency";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

const PRESET_CATEGORIES = ["食事", "住宿", "交通", "購物", "門票", "機票", "其他"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchRate(cur: TravelCurrency, date?: string): Promise<number | null> {
  try {
    const qs = new URLSearchParams({ currency: cur });
    if (date) qs.set("date", date);
    const data = await (await fetch(`/api/fx?${qs}`)).json();
    if (data.rate && Number.isFinite(data.rate) && data.rate > 0) {
      return Math.round(data.rate * 10000) / 10000;
    }
  } catch {}
  return null;
}

export function TravelEntryForm({
  rate: serverRate,
  existingTrips,
  tripCurrencies,
  defaultTrip,
  defaultCurrency,
  initial,
}: {
  rate: number;
  existingTrips: string[];
  tripCurrencies: Record<string, TravelCurrency>;
  defaultTrip?: string;
  defaultCurrency: TravelCurrency;
  initial?: {
    id: string;
    trip_name: string;
    occurred_on: string;
    category: string;
    description?: string | null;
    amount_jpy: number;
    currency: TravelCurrency;
    exchange_rate: number;
    payment_method?: string | null;
  };
}) {
  const isEdit = !!initial;

  const [currency, setCurrency] = useState<TravelCurrency>(initial?.currency ?? defaultCurrency);
  const [fxValue, setFxValue] = useState(isEdit ? String(initial!.amount_jpy) : "");
  const [twdValue, setTwdValue] = useState(
    isEdit ? String(Math.round(initial!.amount_jpy * initial!.exchange_rate)) : ""
  );
  const [category, setCategory] = useState(isEdit ? initial!.category : "");
  const [payment, setPayment] = useState(initial?.payment_method ?? "");
  const [tripValue, setTripValue] = useState(initial?.trip_name ?? defaultTrip ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [dateValue, setDateValue] = useState(initial?.occurred_on ?? today());
  const [rate, setRate] = useState(initial?.exchange_rate ?? serverRate);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [rateFetching, setRateFetching] = useState(false);
  const lastEdited = useRef<"fx" | "twd">("fx");
  const dateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const info = CURRENCY_INFO[currency];
  const isTwd = currency === "TWD";

  // 已知行程只給該行程的外幣 + 台幣（新加坡行程不會出現 JPY）；新行程才列全部
  const tripCurrency = tripCurrencies[tripValue];
  const currencyOptions: TravelCurrency[] = tripCurrency
    ? Array.from(new Set<TravelCurrency>([tripCurrency, "TWD", currency]))
    : [...TRAVEL_CURRENCIES];

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    isEdit
      ? (_prev, fd) => updateTravelExpense(fd)
      : (_prev, fd) => createTravelExpense(fd),
    undefined
  );

  /** 套用新匯率，依最後輸入的欄位重算另一邊 */
  function applyRate(r: number, cur: TravelCurrency = currency) {
    setRate(r);
    if (lastEdited.current === "fx" && fxValue !== "") {
      setTwdValue(String(Math.round(Number(fxValue) * r)));
    } else if (lastEdited.current === "twd" && twdValue !== "") {
      setFxValue(String(roundFx(Number(twdValue) / r, cur)));
    }
  }

  useEffect(() => {
    fetchRate(currency).then((r) => {
      if (r === null) return;
      setLiveRate(r);
      if (!isEdit) applyRate(r);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.ok && !isEdit) {
      setFxValue("");
      setTwdValue("");
      setCategory("");
      setPayment("");
      setDesc("");
      setDateValue(today());
    }
  }, [state, isEdit]);

  async function changeCurrency(cur: TravelCurrency) {
    if (cur === currency) return;
    setCurrency(cur);
    setLiveRate(null);
    setRateFetching(true);
    const [live, forDate] = await Promise.all([fetchRate(cur), dateValue ? fetchRate(cur, dateValue) : null]);
    setRateFetching(false);
    if (live !== null) setLiveRate(live);
    const r = forDate ?? live ?? CURRENCY_INFO[cur].fx.fallback;
    // 換幣別時保留台幣金額，重算外幣
    lastEdited.current = "twd";
    setRate(r);
    if (twdValue !== "") setFxValue(String(roundFx(Number(twdValue) / r, cur)));
  }

  function handleTrip(v: string) {
    setTripValue(v);
    const cur = tripCurrencies[v];
    if (cur) changeCurrency(cur);
  }

  function handleDate(v: string) {
    setDateValue(v);
    clearTimeout(dateTimer.current);
    if (!v) return;
    dateTimer.current = setTimeout(async () => {
      setRateFetching(true);
      const r = await fetchRate(currency, v);
      setRateFetching(false);
      if (r !== null) applyRate(r);
    }, 600);
  }

  function handleFx(v: string) {
    lastEdited.current = "fx";
    setFxValue(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n) && n >= 0) {
      setTwdValue(String(Math.round(n * rate)));
    } else {
      setTwdValue("");
    }
  }

  function handleTwd(v: string) {
    lastEdited.current = "twd";
    setTwdValue(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n) && n >= 0 && rate > 0) {
      setFxValue(String(roundFx(n / rate, currency)));
    } else {
      setFxValue("");
    }
  }

  function handleRate(v: string) {
    const n = Number(v);
    setRate(Number.isFinite(n) && n > 0 ? n : 0);
    if (Number.isFinite(n) && n > 0) applyRate(n);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">{isEdit ? "修改支出" : "新增支出"}</h2>
        {liveRate && !isTwd ? (
          <span className="text-xs text-zinc-400">
            即時匯率：1 {currency} ≈ {liveRate.toFixed(4)} TWD
          </span>
        ) : null}
      </div>

      <form action={action} className="space-y-3">
        {isEdit && <input type="hidden" name="id" value={initial!.id} />}
        <input type="hidden" name="amount_jpy" value={fxValue || "0"} />
        <input type="hidden" name="currency" value={currency} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">日期</span>
            <input
              name="occurred_on"
              type="date"
              value={dateValue}
              onChange={(e) => handleDate(e.target.value)}
              onClick={(e) => {
                try { (e.target as HTMLInputElement).showPicker(); } catch {}
              }}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-zinc-200/90">類別（可自填）</span>
            <div className="mt-1">
              <Combobox
                name="category"
                options={PRESET_CATEGORIES}
                value={category}
                onChange={setCategory}
                placeholder="選擇或輸入"
                required
              />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">
              金額（
              <select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value as TravelCurrency)}
                className="cursor-pointer bg-transparent text-sky-300 outline-none"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">{c}</option>
                ))}
              </select>
              ）
            </span>
            <input
              type="number"
              min="0"
              step={info.decimals > 0 ? 1 / 10 ** info.decimals : 1}
              value={fxValue}
              onChange={(e) => handleFx(e.target.value)}
              required
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          {!isTwd && (
          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">換算（TWD）</span>
            <input
              type="number"
              min="0"
              step="1"
              value={twdValue}
              onChange={(e) => handleTwd(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300 outline-none focus:border-emerald-400/40"
            />
          </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
          <div>
            <span className="text-xs font-medium text-zinc-200/90">支付方式</span>
            <div className="mt-1">
              <Combobox
                name="payment_method"
                options={info.payments}
                value={payment}
                onChange={setPayment}
                placeholder="選擇或輸入"
              />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">
              匯率{rateFetching && <span className="ml-1 text-zinc-500">查詢中…</span>}
            </span>
            <input
              name="exchange_rate"
              type="number"
              step="0.0001"
              min="0.0001"
              value={rate || ""}
              onChange={(e) => handleRate(e.target.value)}
              readOnly={isTwd}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25 read-only:text-zinc-500"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-zinc-200/90">行程名稱</span>
            <div className="mt-1">
              <Combobox
                name="trip_name"
                options={existingTrips}
                value={tripValue}
                onChange={handleTrip}
                placeholder="例：2026 新加坡"
                required
              />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">描述（可空）</span>
            <input
              name="description"
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="例：吉野家牛丼"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending
              ? (isEdit ? "儲存中…" : "新增中…")
              : (isEdit ? "儲存修改" : "新增")}
          </button>
          {isEdit && (
            <Link href="/travel" className="text-sm text-zinc-400 hover:text-zinc-200">
              取消
            </Link>
          )}
          {state?.message && (
            <span className={["text-xs", state.ok ? "text-emerald-400" : "text-rose-400"].join(" ")}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
