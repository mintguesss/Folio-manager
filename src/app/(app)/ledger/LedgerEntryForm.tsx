"use client";

import { useActionState, useState, useEffect } from "react";
import { Combobox } from "@/components/Combobox";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

const PAYMENT_OPTIONS = ["現金", "LinePay", "華南銀行", "中國信託"];
const CATEGORY_OPTIONS = ["早餐", "午餐", "晚餐", "點心", "交通", "網購", "購物"];

type Initial = {
  id: string;
  occurred_on: string;
  entry_type: string;
  amount: number;
  account?: string | null;
  category_text?: string | null;
  counterparty?: string | null;
  memo?: string | null;
};

export function LedgerEntryForm({
  onCreate,
  onUpdate,
  initial,
}: {
  onCreate?: (formData: FormData) => Promise<ActionResult>;
  onUpdate?: (formData: FormData) => Promise<ActionResult>;
  initial?: Initial;
}) {
  const isEdit = !!initial;
  const [entryType, setEntryType] = useState(initial?.entry_type ?? "expense");
  const [account, setAccount] = useState(initial?.account ?? "");
  const [category, setCategory] = useState(initial?.category_text ?? "");

  const submitFn = isEdit ? onUpdate! : onCreate!;

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => submitFn(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok && !isEdit) {
      setEntryType("expense");
      setAccount("");
      setCategory("");
    }
  }, [state, isEdit]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{isEdit ? "修改記帳" : "新增記帳"}</h2>
        {state?.message ? (
          <span className={["text-xs", state.ok ? "text-emerald-400" : "text-red-400"].join(" ")}>
            {state.message}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">自由輸入，欄位可空</span>
        )}
      </div>

      <form action={action} className="grid grid-cols-2 gap-3">
        {isEdit && <input type="hidden" name="id" value={initial!.id} />}

        {/* Row 1: 日期 | 類型 */}
        <label className="block">
          <span className="text-xs font-medium text-zinc-200/90">日期</span>
          <input
            name="occurred_on"
            type="date"
            defaultValue={initial?.occurred_on}
            required
            onClick={(e) => {
              try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch {}
            }}
            className="mt-1 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        <div>
          <span className="text-xs font-medium text-zinc-200/90">類型</span>
          <div className="relative mt-1">
            <select
              name="entry_type"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-white/25"
            >
              <option value="expense">支出</option>
              <option value="income">收入</option>
              <option value="transfer">轉帳</option>
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Row 2: 金額 | 支付方式 */}
        <label className="block">
          <span className="text-xs font-medium text-zinc-200/90">金額</span>
          <input
            name="amount"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={initial?.amount ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        <div>
          <span className="text-xs font-medium text-zinc-200/90">支付方式（可空）</span>
          <div className="mt-1">
            <Combobox
              name="account"
              options={PAYMENT_OPTIONS}
              value={account}
              onChange={setAccount}
              placeholder="LinePay / 現金 / ..."
            />
          </div>
        </div>

        {/* Row 3: 分類 | 對象 */}
        <div>
          <span className="text-xs font-medium text-zinc-200/90">分類（可空）</span>
          <div className="mt-1">
            <Combobox
              name="category_text"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
              placeholder="早餐 / 午餐 / ..."
            />
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-zinc-200/90">對象（可空）</span>
          <input
            name="counterparty"
            defaultValue={initial?.counterparty ?? ""}
            placeholder="店家 / 人名"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        {/* Row 4: 備註 (full width) */}
        <label className="col-span-2 block">
          <span className="text-xs font-medium text-zinc-200/90">備註（可空）</span>
          <textarea
            name="memo"
            rows={2}
            defaultValue={initial?.memo ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
          />
        </label>

        <div className="col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? (isEdit ? "儲存中…" : "新增中…") : (isEdit ? "儲存修改" : "新增")}
          </button>
        </div>
      </form>
    </div>
  );
}
