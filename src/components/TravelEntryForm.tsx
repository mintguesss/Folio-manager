"use client";

import Link from "next/link";
import { useActionState, useState, useEffect, useRef } from "react";
import { createTravelExpense, updateTravelExpense } from "@/app/actions/travel";
import { Combobox } from "@/components/Combobox";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

const PRESET_CATEGORIES = ["食事", "住宿", "交通", "購物", "門票", "其他"];
const PRESET_PAYMENT = ["信用卡", "現金", "Suica"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TravelEntryForm({
  rate: serverRate,
  existingTrips,
  defaultTrip,
  initial,
}: {
  rate: number;
  existingTrips: string[];
  defaultTrip?: string;
  initial?: {
    id: string;
    trip_name: string;
    occurred_on: string;
    category: string;
    description?: string | null;
    amount_jpy: number;
    exchange_rate: number;
    payment_method?: string | null;
  };
}) {
  const isEdit = !!initial;

  const [jpyValue, setJpyValue] = useState(isEdit ? String(initial!.amount_jpy) : "");
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
  const lastEdited = useRef<"jpy" | "twd">("jpy");
  const dateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    isEdit
      ? (_prev, fd) => updateTravelExpense(fd)
      : (_prev, fd) => createTravelExpense(fd),
    undefined
  );

  useEffect(() => {
    fetch("/api/fx")
      .then((r) => r.json())
      .then((data) => {
        if (data.rate && Number.isFinite(data.rate) && data.rate > 0) {
          const r = Math.round(data.rate * 10000) / 10000;
          setLiveRate(r);
          if (!isEdit) {
            setRate(r);
            if (lastEdited.current === "jpy" && jpyValue !== "") {
              const n = Number(jpyValue);
              if (Number.isFinite(n)) setTwdValue(String(Math.round(n * r)));
            }
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.ok && !isEdit) {
      setJpyValue("");
      setTwdValue("");
      setCategory("");
      setPayment("");
      setDesc("");
      setDateValue(today());
    }
  }, [state, isEdit]);

  function handleDate(v: string) {
    setDateValue(v);
    clearTimeout(dateTimer.current);
    if (!v) return;
    dateTimer.current = setTimeout(async () => {
      setRateFetching(true);
      try {
        const res = await fetch(`/api/fx?date=${encodeURIComponent(v)}`);
        const data = await res.json();
        if (data.rate && Number.isFinite(data.rate) && data.rate > 0) {
          const r = Math.round(data.rate * 10000) / 10000;
          setRate(r);
          if (lastEdited.current === "jpy" && jpyValue !== "") {
            setTwdValue(String(Math.round(Number(jpyValue) * r)));
          } else if (lastEdited.current === "twd" && twdValue !== "") {
            setJpyValue(String(Math.round(Number(twdValue) / r)));
          }
        }
      } catch {}
      finally { setRateFetching(false); }
    }, 600);
  }

  function handleJpy(v: string) {
    lastEdited.current = "jpy";
    setJpyValue(v);
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
      setJpyValue(String(Math.round(n / rate)));
    } else {
      setJpyValue("");
    }
  }

  function handleRate(v: string) {
    const n = Number(v);
    setRate(Number.isFinite(n) && n > 0 ? n : 0);
    if (Number.isFinite(n) && n > 0) {
      if (lastEdited.current === "jpy" && jpyValue !== "") {
        setTwdValue(String(Math.round(Number(jpyValue) * n)));
      } else if (lastEdited.current === "twd" && twdValue !== "") {
        setJpyValue(String(Math.round(Number(twdValue) / n)));
      }
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white">{isEdit ? "修改支出" : "新增支出"}</h2>
        {liveRate ? (
          <span className="text-xs text-zinc-400">
            即時匯率：1 JPY ≈ {liveRate.toFixed(4)} TWD
          </span>
        ) : null}
      </div>

      <form action={action} className="space-y-3">
        {isEdit && <input type="hidden" name="id" value={initial!.id} />}
        <input type="hidden" name="amount_jpy" value={jpyValue || "0"} />

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
            <span className="text-xs font-medium text-zinc-200/90">金額（JPY）</span>
            <input
              type="number"
              min="0"
              step="1"
              value={jpyValue}
              onChange={(e) => handleJpy(e.target.value)}
              required
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

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
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
          <div>
            <span className="text-xs font-medium text-zinc-200/90">支付方式</span>
            <div className="mt-1">
              <Combobox
                name="payment_method"
                options={PRESET_PAYMENT}
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
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-zinc-200/90">行程名稱</span>
            <div className="mt-1">
              <Combobox
                name="trip_name"
                options={existingTrips}
                value={tripValue}
                onChange={setTripValue}
                placeholder="例：2026 東京之旅"
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
