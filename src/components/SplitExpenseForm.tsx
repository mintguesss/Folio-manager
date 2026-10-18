"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Combobox } from "@/components/Combobox";
import { CURRENCY_INFO, roundFx, type TravelCurrency } from "@/lib/currency";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;
type Member = { id: string; name: string; is_self: boolean };

const TRAVEL_CATEGORIES = ["食事", "住宿", "交通", "購物", "門票", "其他"];
const GENERAL_CATEGORIES = ["早餐", "午餐", "晚餐", "點心", "交通", "網購", "購物", "其他"];
const GENERAL_PAYMENT = ["現金", "LinePay", "華南銀行", "中國信託"];

const inputCls =
  "mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 placeholder:text-zinc-500";
const selectCls =
  "w-full appearance-none rounded-xl border border-zinc-600 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-zinc-400";
const labelCls = "text-xs font-medium text-zinc-200";

function SelectArrow() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
      viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

type InitialValues = {
  expense_date: string;
  description: string;
  amount: number;
  exchange_rate?: number | null;
  category?: string;
  payment_method?: string;
  category_text?: string;
  account?: string;
  counterparty?: string;
  note?: string;
  paid_by: string;
  split_type: "equal" | "custom";
  shares: { member_id: string; share_amount: number; is_settled: boolean }[];
};

export function SplitExpenseForm({
  groupId,
  groupType,
  currency = "JPY",
  members,
  selfMemberId,
  onCreate,
  initialValues,
  submitLabel = "新增支出",
  expenseId,
}: {
  groupId: string;
  groupType: "general" | "travel";
  currency?: TravelCurrency;
  members: Member[];
  selfMemberId?: string;
  onCreate: (formData: FormData) => Promise<ActionResult>;
  initialValues?: InitialValues;
  submitLabel?: string;
  expenseId?: string;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isTravel = groupType === "travel";
  const iv = initialValues;
  const info = CURRENCY_INFO[currency];
  const fxStep = info.decimals > 0 ? 1 / 10 ** info.decimals : 1;
  const fmtF = (n: number) =>
    new Intl.NumberFormat("zh-TW", { maximumFractionDigits: info.decimals }).format(n);

  // ── Amount state
  const [fxValue, setFxValue] = useState(() => isTravel && iv ? String(iv.amount) : "");
  const [twdValue, setTwdValue] = useState(() => {
    if (!isTravel && iv) return String(iv.amount);
    if (isTravel && iv?.exchange_rate && iv.amount) return String(Math.round(iv.amount * iv.exchange_rate));
    return "";
  });
  const [rate, setRate] = useState(iv?.exchange_rate ?? 0);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [rateFetching, setRateFetching] = useState(false);
  const lastEdited = useRef<"fx" | "twd">("fx");
  const dateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [dateValue, setDateValue] = useState(iv?.expense_date ?? todayStr);

  // ── Split state
  const [splitType, setSplitType] = useState<"equal" | "custom">(iv?.split_type ?? "equal");
  const [paidBy, setPaidBy] = useState(
    iv?.paid_by ?? selfMemberId ?? members.find((m) => m.is_self)?.id ?? members[0]?.id ?? ""
  );
  const [participants, setParticipants] = useState<Set<string>>(() => {
    if (iv?.shares) return new Set(iv.shares.map((s) => s.member_id));
    return new Set(members.map((m) => m.id));
  });
  const [customShares, setCustomShares] = useState<Record<string, string>>(() => {
    if (iv?.split_type === "custom" && iv.shares) {
      return Object.fromEntries(iv.shares.map((s) => [s.member_id, String(s.share_amount)]));
    }
    return {};
  });
  const [customSharesAlt, setCustomSharesAlt] = useState<Record<string, string>>({});

  // ── Type-specific state
  const [category, setCategory] = useState(iv?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState(iv?.payment_method ?? "");
  const [categoryText, setCategoryText] = useState(iv?.category_text ?? "");
  const [account, setAccount] = useState(iv?.account ?? "");

  // ── Controlled text fields (needed for edit pre-fill)
  const [description, setDescription] = useState(iv?.description ?? "");
  const [counterparty, setCounterparty] = useState(
    iv?.counterparty || (!isTravel && iv?.description ? iv.description : "")
  );
  const [note, setNote] = useState(iv?.note ?? "");

  // ── Fetch live rate on mount (travel only; skip if editing with existing rate)
  useEffect(() => {
    if (!isTravel || iv?.exchange_rate) return;
    fetch(`/api/fx?currency=${currency}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rate && Number.isFinite(data.rate) && data.rate > 0) {
          const r = Math.round(data.rate * 10000) / 10000;
          setLiveRate(r);
          setRate(r);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTravel]);

  function handleDate(v: string) {
    setDateValue(v);
    clearTimeout(dateTimer.current);
    if (!v || !isTravel) return;
    dateTimer.current = setTimeout(async () => {
      setRateFetching(true);
      try {
        const res = await fetch(`/api/fx?currency=${currency}&date=${encodeURIComponent(v)}`);
        const data = await res.json();
        if (data.rate && Number.isFinite(data.rate) && data.rate > 0) {
          const r = Math.round(data.rate * 10000) / 10000;
          setRate(r);
          if (lastEdited.current === "fx" && fxValue !== "") {
            setTwdValue(String(Math.round(Number(fxValue) * r)));
          } else if (lastEdited.current === "twd" && twdValue !== "") {
            setFxValue(String(roundFx(Number(twdValue) / r, currency)));
          }
        }
      } catch {}
      finally { setRateFetching(false); }
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
    if (isTravel) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n) && n >= 0 && rate > 0) {
        setFxValue(String(roundFx(n / rate, currency)));
      } else {
        setFxValue("");
      }
    }
  }

  function handleRate(v: string) {
    const n = Number(v);
    setRate(Number.isFinite(n) && n > 0 ? n : 0);
    if (Number.isFinite(n) && n > 0) {
      if (lastEdited.current === "fx" && fxValue !== "") {
        setTwdValue(String(Math.round(Number(fxValue) * n)));
      } else if (lastEdited.current === "twd" && twdValue !== "") {
        setFxValue(String(roundFx(Number(twdValue) / n, currency)));
      }
      setCustomSharesAlt(() => {
        const updated: Record<string, string> = {};
        for (const [id, jpy] of Object.entries(customShares)) {
          const j = Number(jpy);
          updated[id] = jpy !== "" && Number.isFinite(j) ? String(Math.round(j * n)) : "";
        }
        return updated;
      });
    }
  }

  function handleCustomPrimary(id: string, v: string) {
    setCustomShares((prev) => ({ ...prev, [id]: v }));
    const n = Number(v);
    setCustomSharesAlt((prev) => ({
      ...prev,
      [id]: v !== "" && Number.isFinite(n) && n >= 0 && rate > 0 ? String(Math.round(n * rate)) : "",
    }));
  }

  function handleCustomAlt(id: string, v: string) {
    setCustomSharesAlt((prev) => ({ ...prev, [id]: v }));
    const n = Number(v);
    setCustomShares((prev) => ({
      ...prev,
      [id]: v !== "" && Number.isFinite(n) && n >= 0 && rate > 0 ? String(roundFx(n / rate, currency)) : "",
    }));
  }

  const amountNum = isTravel ? Number(fxValue) : Number(twdValue);
  const participantList = members.filter((m) => participants.has(m.id));
  const equalShare = participantList.length > 0 && amountNum > 0 ? amountNum / participantList.length : 0;

  const customTotal = members
    .filter((m) => participants.has(m.id))
    .reduce((s, m) => s + (Number(customShares[m.id]) || 0), 0);
  const customTotalAlt = members
    .filter((m) => participants.has(m.id))
    .reduce((s, m) => s + (Number(customSharesAlt[m.id]) || 0), 0);
  const customValid =
    splitType !== "custom" || !amountNum || Math.abs(customTotal - amountNum) < 0.01;

  function toggleParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("amount", isTravel ? (fxValue || "0") : (twdValue || "0"));
      formData.set("currency", isTravel ? currency : "TWD");
      if (isTravel && rate > 0) formData.set("exchange_rate", String(rate));
      formData.set("split_type", splitType);
      formData.set("description", isTravel ? description : counterparty);
      formData.set("note", note);
      if (isTravel) {
        formData.set("category", category);
        formData.set("payment_method", paymentMethod);
      } else {
        formData.set("category_text", categoryText);
        formData.set("account", account);
        formData.set("counterparty", counterparty);
      }
      const shares = members
        .filter((m) => participants.has(m.id))
        .map((m) => ({
          member_id: m.id,
          share_amount: splitType === "equal" ? equalShare : Number(customShares[m.id]) || 0,
          is_settled: m.id === paidBy,
        }));
      formData.set("shares_json", JSON.stringify(shares));
      return onCreate(formData);
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="group_id" value={groupId} />
      {expenseId && <input type="hidden" name="expense_id" value={expenseId} />}

      {/* ── Date + Exchange rate ── */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block min-w-0">
          <span className={labelCls}>日期</span>
          <input
            name="expense_date"
            type="date"
            value={dateValue}
            onChange={(e) => handleDate(e.target.value)}
            onClick={(e) => {
              try {
                (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
              } catch {}
            }}
            required
            className="mt-1 w-full cursor-pointer rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
          />
        </label>

        {isTravel ? (
          <label className="block min-w-0">
            <span className={labelCls}>
              匯率
              {liveRate && <span className="ml-1.5 text-[10px] text-zinc-400">即時 {liveRate.toFixed(4)}</span>}
              {iv?.exchange_rate && !liveRate && <span className="ml-1.5 text-[10px] text-zinc-500">存檔 {iv.exchange_rate.toFixed(4)}</span>}
              {rateFetching && <span className="ml-1 text-[10px] text-zinc-500">查詢中…</span>}
            </span>
            <input
              type="number" step="0.0001" min="0.0001"
              value={rate || ""}
              onChange={(e) => handleRate(e.target.value)}
              className={inputCls}
            />
          </label>
        ) : <div />}
      </div>

      {/* ── Amount ── */}
      {isTravel ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>金額（{currency}）</span>
            <input type="number" min="0" step={fxStep} value={fxValue} onChange={(e) => handleFx(e.target.value)} placeholder="0" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>換算（TWD）</span>
            <input
              type="number" min="0" step="1" value={twdValue} onChange={(e) => handleTwd(e.target.value)} placeholder="0"
              className="mt-1 w-full rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 outline-none focus:border-emerald-500/70"
            />
          </label>
        </div>
      ) : (
        <label className="block">
          <span className={labelCls}>金額（TWD）</span>
          <input type="number" min="0" step="any" value={twdValue} onChange={(e) => handleTwd(e.target.value)} placeholder="0" className={inputCls} />
        </label>
      )}

      {/* ── Description (travel only) / Shop name (general) ── */}
      {isTravel ? (
        <label className="block">
          <span className={labelCls}>描述</span>
          <input
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例：海南雞飯、捷運、飯店"
            className={inputCls}
          />
        </label>
      ) : (
        <label className="block">
          <span className={labelCls}>店家/名稱（可空）</span>
          <input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="例：麥當勞、7-11"
            className={inputCls}
          />
        </label>
      )}

      {/* ── Travel extras ── */}
      {isTravel && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>類別</span>
            <div className="relative mt-1">
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                <option value="">選擇類別</option>
                {TRAVEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <SelectArrow />
            </div>
          </div>
          <div>
            <span className={labelCls}>支付方式（可空）</span>
            <div className="mt-1">
              <Combobox name="payment_method" options={info.payments} value={paymentMethod} onChange={setPaymentMethod} placeholder="現金 / 信用卡 / ..." />
            </div>
          </div>
        </div>
      )}

      {/* ── General extras ── */}
      {!isTravel && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={labelCls}>分類（可空）</span>
            <div className="mt-1">
              <Combobox name="category_text" options={GENERAL_CATEGORIES} value={categoryText} onChange={setCategoryText} placeholder="早餐 / 午餐 / ..." />
            </div>
          </div>
          <div>
            <span className={labelCls}>支付方式（可空）</span>
            <div className="mt-1">
              <Combobox name="account" options={GENERAL_PAYMENT} value={account} onChange={setAccount} placeholder="LinePay / 現金 / ..." />
            </div>
          </div>
        </div>
      )}

      {/* ── Paid by + Split type ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>由誰付款</span>
          <div className="relative mt-1">
            <select name="paid_by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={selectCls}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{(selfMemberId ? m.id === selfMemberId : m.is_self) ? "（我）" : ""}</option>
              ))}
            </select>
            <SelectArrow />
          </div>
        </div>
        <div>
          <span className={labelCls}>分帳方式</span>
          <div className="relative mt-1">
            <select value={splitType} onChange={(e) => setSplitType(e.target.value as "equal" | "custom")} className={selectCls}>
              <option value="equal">平均分攤</option>
              <option value="custom">自訂金額</option>
            </select>
            <SelectArrow />
          </div>
        </div>
      </div>

      {/* ── Note ── */}
      <label className="block">
        <span className={labelCls}>備註（可空）</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </label>

      {/* ── Members + shares ── */}
      <div>
        <span className={["mb-2 block", labelCls].join(" ")}>參與成員</span>
        <div className="space-y-2">
          {members.map((m) => {
            const included = participants.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleParticipant(m.id)}
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    included ? "border-sky-500 bg-sky-500/20 text-sky-300" : "border-zinc-600 text-transparent",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                    <polyline points="1 6 4 9 11 2" />
                  </svg>
                </button>
                <span className={["flex-1 text-sm", included ? "text-zinc-100" : "text-zinc-600"].join(" ")}>
                  {m.name}
                  {(selfMemberId ? m.id === selfMemberId : m.is_self) && <span className="ml-1 text-xs text-zinc-500">（我）</span>}
                </span>
                {splitType === "equal" && included && equalShare > 0 && (
                  isTravel ? (
                    <div className="shrink-0 text-right text-xs tabular-nums">
                      {rate > 0 && <div className="text-emerald-300">{fmt(Math.round(equalShare * rate))} <span className="text-emerald-400/50">TWD</span></div>}
                      <div className={rate > 0 ? "text-zinc-500" : "text-sky-300"}>{fmtF(equalShare)} <span className="text-zinc-600">{currency}</span></div>
                    </div>
                  ) : (
                    <span className="shrink-0 tabular-nums text-xs text-sky-300">{fmt(equalShare)}</span>
                  )
                )}
                {splitType === "custom" && included && (
                  isTravel ? (
                    <div className="flex gap-1.5">
                      <input
                        type="number" step={fxStep} min="0" value={customShares[m.id] ?? ""} onChange={(e) => handleCustomPrimary(m.id, e.target.value)} placeholder={currency}
                        className="w-[4.5rem] rounded-xl border border-zinc-600 bg-zinc-800 px-2 py-1 text-right text-sm tabular-nums text-zinc-100 outline-none focus:border-zinc-400 placeholder:text-zinc-600"
                      />
                      <input
                        type="number" step="1" min="0" value={customSharesAlt[m.id] ?? ""} onChange={(e) => handleCustomAlt(m.id, e.target.value)} placeholder="TWD"
                        className="w-[4.5rem] rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-2 py-1 text-right text-sm tabular-nums text-emerald-300 outline-none focus:border-emerald-500/70 placeholder:text-zinc-600"
                      />
                    </div>
                  ) : (
                    <input
                      type="number" step="any" min="0" value={customShares[m.id] ?? ""} onChange={(e) => setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      className="w-24 rounded-xl border border-zinc-600 bg-zinc-800 px-2 py-1 text-right text-sm tabular-nums text-zinc-100 outline-none focus:border-zinc-400"
                    />
                  )
                )}
              </div>
            );
          })}
        </div>

        {splitType === "custom" && amountNum > 0 && (
          <div className="mt-2 space-y-0.5 text-right text-xs">
            <div className={customValid ? "text-emerald-400" : "text-rose-400"}>
              合計 {isTravel ? `${fmtF(customTotal)} / ${fmtF(amountNum)} ${currency}` : `${fmt(customTotal)} / ${fmt(amountNum)} TWD`}
              {!customValid && " （金額不符）"}
            </div>
            {isTravel && rate > 0 && (
              <div className="text-zinc-500">≈ {fmt(customTotalAlt)} / {fmt(Math.round(amountNum * rate))} TWD</div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !customValid}
        className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "處理中…" : submitLabel}
      </button>

      {state?.message && (
        <p className={["text-center text-xs", state.ok ? "text-emerald-400" : "text-red-400"].join(" ")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
