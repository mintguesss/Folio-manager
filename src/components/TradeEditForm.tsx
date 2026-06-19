"use client";

import { useActionState, useState } from "react";
import { updateTrade } from "@/app/actions/stocks";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;
type MarketType = "TW" | "US";

export type TradeEditData = {
  id: string;
  market: MarketType;
  symbol: string;
  name: string | null;
  side: "BUY" | "SELL";
  trade_date: string;
  quantity: number;
  price: number;
  currency: string;
  fee: number;
  tax: number;
  fx_rate?: number | null;
  note: string | null;
};

function Field({
  label, name, type = "text", defaultValue, step, placeholder, required = true,
}: {
  label: string; name: string; type?: string;
  defaultValue?: string | number | null;
  step?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-200/90">{label}</span>
      <input
        name={name} type={type} step={step}
        defaultValue={defaultValue ?? ""}
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

export function TradeEditForm({ trade }: { trade: TradeEditData }) {
  const [currency, setCurrency] = useState(trade.currency);
  const isUS = trade.market === "US";

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    (_prev, fd) => updateTrade(fd),
    undefined
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={trade.id} />

        <label className="block">
          <span className="text-xs font-medium text-zinc-200/90">市場</span>
          <select
            name="market"
            defaultValue={trade.market}
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
            defaultValue={trade.side}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          >
            <option value="BUY">買進</option>
            <option value="SELL">賣出</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-zinc-200/90">股票代號</span>
          <input
            name="symbol"
            type="text"
            defaultValue={trade.symbol}
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-zinc-200/90">股票名稱（可空）</span>
          <input
            name="name"
            type="text"
            defaultValue={trade.name ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        <Field label="交易日" name="trade_date" type="date" defaultValue={trade.trade_date} />
        <Field label="數量" name="quantity" type="number" step="1" defaultValue={trade.quantity} />
        <Field label="成交價" name="price" type="number" step="0.0001" defaultValue={trade.price} />

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

        <Field label="手續費" name="fee" type="number" step="0.01" defaultValue={trade.fee} />
        <Field label="稅" name="tax" type="number" step="0.01" defaultValue={trade.tax} />

        {isUS && (
          <Field
            label="USD/TWD 匯率"
            name="fx_rate"
            type="number"
            step="0.0001"
            defaultValue={trade.fx_rate ?? ""}
            required={false}
            placeholder="選填"
          />
        )}

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-zinc-200/90">備註（可空）</span>
          <textarea
            name="note"
            defaultValue={trade.note ?? ""}
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
            {pending ? "儲存中…" : "儲存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
