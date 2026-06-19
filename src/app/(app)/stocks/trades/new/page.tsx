"use client";

import Link from "next/link";
import { useActionState, useState, useEffect, useRef } from "react";
import { createTrade } from "@/app/actions/stocks";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;
type MarketType = "TW" | "US";

function Field({
  label, name, type = "text", value, onChange, defaultValue, step, placeholder, required = true,
}: {
  label: string; name: string; type?: string;
  value?: string | number; onChange?: (v: string) => void;
  defaultValue?: string | number;
  step?: string; placeholder?: string; required?: boolean;
}) {
  const isControlled = value !== undefined;
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-200/90">{label}</span>
      <input
        name={name} type={type} step={step}
        {...(isControlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue: defaultValue ?? "" })}
        placeholder={placeholder}
        required={required}
        onClick={type === "date"
          ? (e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }
          : undefined}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
      />
    </label>
  );
}

function StockSearch({ market }: { market: MarketType }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reset when market changes
  useEffect(() => {
    setQuery("");
    setSelected(null);
    setResults([]);
    setOpen(false);
  }, [market]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleInput(v: string) {
    setQuery(v);
    setSelected(null);
    clearTimeout(timer.current);
    if (v.length < 1) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(v)}&market=${market}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {}
      finally { setLoading(false); }
    }, 300);
  }

  function select(item: { symbol: string; name: string }) {
    setSelected(item);
    setQuery(
      market === "TW"
        ? `${item.name}（${item.symbol}）`
        : `${item.symbol}${item.name ? " - " + item.name : ""}`
    );
    setResults([]);
    setOpen(false);
  }

  // When cleared back to raw text (no selection), use the raw text as symbol
  const symbolValue = selected?.symbol ?? query.trim().toUpperCase().split(/[（\s-]/)[0];
  const nameValue = selected?.name ?? "";

  return (
    <div className="sm:col-span-2" ref={ref}>
      <span className="text-xs font-medium text-zinc-200/90">
        {market === "TW" ? "代號 / 名稱（可輸入中文搜尋）" : "代號 / 名稱（輸入可搜尋）"}
      </span>
      <input type="hidden" name="symbol" value={symbolValue} />
      <input type="hidden" name="name" value={nameValue} />
      <div className="relative mt-1">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={market === "TW" ? "台積電 或 2330" : "AAPL 或 Apple"}
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
        />
        {loading && (
          <span className="absolute right-3 top-2.5 text-xs text-zinc-500">搜尋中…</span>
        )}
        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-xl">
            {results.map((r) => (
              <li
                key={r.symbol}
                onMouseDown={(e) => { e.preventDefault(); select(r); }}
                className="flex cursor-pointer items-baseline gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
              >
                {market === "TW" ? (
                  <>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-zinc-500">{r.symbol}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{r.symbol}</span>
                    <span className="text-xs text-zinc-500">{r.name}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function NewTradePage() {
  const [market, setMarket] = useState<MarketType>("TW");
  const [currency, setCurrency] = useState("TWD");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [fxRate, setFxRate] = useState("");
  const [fxLoading, setFxLoading] = useState(false);

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => createTrade(formData),
    undefined
  );

  function handleMarket(v: string) {
    const m = v as MarketType;
    setMarket(m);
    setCurrency(m === "US" ? "USD" : "TWD");
  }

  // Auto-fetch USD/TWD rate when market=US and trade date changes
  useEffect(() => {
    if (market !== "US") { setFxRate(""); return; }
    setFxLoading(true);
    fetch(`/api/stocks/fx-rate?date=${tradeDate}`)
      .then((r) => r.json())
      .then((d) => { if (d.rate) setFxRate(String(Number(d.rate).toFixed(4))); })
      .catch(() => {})
      .finally(() => setFxLoading(false));
  }, [market, tradeDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">新增股票交易</h1>
          <p className="mt-1 text-sm text-zinc-300">手動輸入買/賣，台股/美股分開。</p>
        </div>
        <Link href="/stocks/positions" className="text-sm font-medium text-zinc-200 hover:underline">
          返回股票記帳
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">市場</span>
            <select
              name="market"
              value={market}
              onChange={(e) => handleMarket(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            >
              <option value="TW">台股</option>
              <option value="US">美股</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">買/賣</span>
            <select
              name="side"
              defaultValue="BUY"
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            >
              <option value="BUY">買進</option>
              <option value="SELL">賣出</option>
            </select>
          </label>

          {/* Stock search — spans full width */}
          <StockSearch market={market} />

          <Field
            label="交易日"
            name="trade_date"
            type="date"
            value={tradeDate}
            onChange={setTradeDate}
          />

          <Field label="數量" name="quantity" type="number" step="1" defaultValue="1" />
          <Field label="成交價" name="price" type="number" step="0.0001" placeholder="0" />

          <label className="block">
            <span className="text-xs font-medium text-zinc-200/90">幣別</span>
            <input
              name="currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            />
          </label>

          <Field label="手續費（可 0）" name="fee" type="number" step="0.01" defaultValue="0" />
          <Field label="稅（可 0）" name="tax" type="number" step="0.01" defaultValue="0" />

          {market === "US" && (
            <label className="block">
              <span className="text-xs font-medium text-zinc-200/90">
                USD/TWD 匯率
                {fxLoading && <span className="ml-1 font-normal text-zinc-500">（載入中…）</span>}
              </span>
              <input
                name="fx_rate"
                type="number"
                step="0.0001"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                placeholder="自動填入"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
              />
            </label>
          )}

          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-zinc-200/90">備註（可空）</span>
            <textarea
              name="note"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
              rows={2}
            />
          </label>

          <div className="sm:col-span-2">
            {state?.message ? (
              <p className={["mb-2 text-sm", state.ok ? "text-emerald-400" : "text-red-500"].join(" ")}>
                {state.message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "新增中…" : "新增交易"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
