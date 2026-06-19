"use client";

import { useActionState, useEffect } from "react";
import { upsertAssetSnapshot } from "@/app/actions/assets";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

function Field({
  label,
  name,
  defaultValue,
  type = "number",
  step = "1",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-200/90">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        required
        onClick={type === "date"
          ? (e) => { try { (e.target as HTMLInputElement).showPicker(); } catch {} }
          : undefined}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
      />
    </label>
  );
}

export function AssetForm({
  defaults,
  onSuccess,
}: {
  defaults?: {
    snapshot_date?: string;
    total_assets?: number;
    bank_huanan?: number;
    bank_ctbc?: number;
    bank_post?: number;
    bank_taishin?: number;
    tw_stock_value?: number;
    us_stock_value?: number;
    note?: string | null;
  };
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      return await upsertAssetSnapshot(formData);
    },
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">新增 / 覆寫資產記帳</h2>
        {state?.message ? (
          <span className={["text-xs", state.ok ? "text-emerald-700" : "text-red-700"].join(" ")}>
            {state.message}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">同一天會自動覆寫</span>
        )}
      </div>

      <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="日期" name="snapshot_date" type="date" defaultValue={defaults?.snapshot_date} />
        <Field label="總資產" name="total_assets" defaultValue={defaults?.total_assets ?? 0} />
        <Field label="華南" name="bank_huanan" defaultValue={defaults?.bank_huanan ?? 0} />
        <Field label="中國信託" name="bank_ctbc" defaultValue={defaults?.bank_ctbc ?? 0} />
        <Field label="郵局" name="bank_post" defaultValue={defaults?.bank_post ?? 0} />
        <Field label="台新" name="bank_taishin" defaultValue={defaults?.bank_taishin ?? 0} />
        <Field label="台股市值" name="tw_stock_value" defaultValue={defaults?.tw_stock_value ?? 0} />
        <Field label="美股市值" name="us_stock_value" defaultValue={defaults?.us_stock_value ?? 0} />

        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-zinc-200/90">備註（可空）</span>
          <textarea
            name="note"
            defaultValue={defaults?.note ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
            rows={3}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "儲存中…" : "儲存"}
          </button>
        </div>
      </form>
    </div>
  );
}

