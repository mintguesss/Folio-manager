"use client";

import { useActionState, useState } from "react";
import { CURRENCY_INFO, GROUP_CURRENCIES, type TravelCurrency } from "@/lib/currency";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

type Member = { id: number; db_id?: string; name: string; is_self: boolean };

type InitialValues = {
  name: string;
  group_type: "general" | "travel";
  currency: TravelCurrency;
  description: string;
  members: { db_id: string; name: string; is_self: boolean }[];
};

const inputCls =
  "mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 placeholder:text-zinc-500";

export function SplitGroupForm({
  onCreate,
  initialValues,
  groupId,
}: {
  onCreate: (formData: FormData) => Promise<ActionResult>;
  initialValues?: InitialValues;
  groupId?: string;
}) {
  const isEdit = !!groupId;
  const [open, setOpen] = useState(false);
  const [groupType, setGroupType] = useState(initialValues?.group_type ?? "general");
  const [members, setMembers] = useState<Member[]>(() => {
    if (initialValues?.members) {
      return initialValues.members.map((m, i) => ({
        id: i,
        db_id: m.db_id,
        name: m.name,
        is_self: m.is_self,
      }));
    }
    return [
      { id: 0, name: "", is_self: true },
      { id: 1, name: "", is_self: false },
    ];
  });
  const [nextId, setNextId] = useState(() => initialValues?.members?.length ?? 2);

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set(
        "members_json",
        JSON.stringify(
          members
            .filter((m) => m.name.trim())
            .map((m) => ({ db_id: m.db_id, name: m.name.trim(), is_self: m.is_self }))
        )
      );
      return onCreate(formData);
    },
    undefined
  );

  function addMember() {
    setMembers((prev) => [...prev, { id: nextId, name: "", is_self: false }]);
    setNextId((n) => n + 1);
  }

  function removeMember(id: number) {
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (!next.some((m) => m.is_self) && next.length > 0) next[0].is_self = true;
      return next;
    });
  }

  function setSelf(id: number) {
    setMembers((prev) => prev.map((m) => ({ ...m, is_self: m.id === id })));
  }

  const formContent = (
    <form action={action} className="space-y-4">
      {groupId && <input type="hidden" name="group_id" value={groupId} />}
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <label className="col-span-2 block sm:col-span-1">
          <span className="text-xs font-medium text-zinc-200">群組名稱</span>
          <input
            name="name"
            required
            placeholder="例：2026 東京行"
            className={inputCls}
            defaultValue={initialValues?.name ?? ""}
          />
        </label>

        {/* Type */}
        <div className="sm:col-span-1">
          <span className="text-xs font-medium text-zinc-200">類型</span>
          <div className="relative mt-1">
            <select
              name="group_type"
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as "general" | "travel")}
              className="w-full appearance-none rounded-xl border border-zinc-600 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-zinc-400"
            >
              <option value="general">一般記帳</option>
              <option value="travel">出國記帳</option>
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Currency (travel only) */}
        {groupType === "travel" && (
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-zinc-200">幣別</span>
            <div className="relative mt-1">
              <select
                name="currency"
                defaultValue={initialValues?.currency ?? "JPY"}
                className="w-full appearance-none rounded-xl border border-zinc-600 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-zinc-400"
              >
                {GROUP_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{CURRENCY_INFO[c].label}（{c}）</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400"
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>
        )}

        {/* Description */}
        <label className="col-span-2 block">
          <span className="text-xs font-medium text-zinc-200">描述（可空）</span>
          <input
            name="description"
            placeholder="簡短說明"
            className={inputCls}
            defaultValue={initialValues?.description ?? ""}
          />
        </label>
      </div>

      {/* Members */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-200">成員</span>
          <button
            type="button"
            onClick={addMember}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            + 新增成員
          </button>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <input
                value={m.name}
                onChange={(e) =>
                  setMembers((prev) =>
                    prev.map((p) => (p.id === m.id ? { ...p, name: e.target.value } : p))
                  )
                }
                placeholder="成員名稱"
                className="flex-1 rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 placeholder:text-zinc-500"
              />
              <button
                type="button"
                title="標記為自己"
                onClick={() => setSelf(m.id)}
                className={[
                  "shrink-0 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  m.is_self
                    ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                    : "border-white/15 text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                我
              </button>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="shrink-0 text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-600">點「我」標記自己，方便後續結帳顯示。</p>
      </div>

      {state?.ok === false && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "儲存中…" : isEdit ? "儲存修改" : "建立群組"}
      </button>
    </form>
  );

  if (isEdit) {
    return formContent;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-sm font-semibold text-white">新增分帳群組</h2>
        <div className="flex items-center gap-3">
          {state?.message && (
            <span className={["text-xs", state.ok ? "text-emerald-400" : "text-red-400"].join(" ")}>
              {state.message}
            </span>
          )}
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={["h-3 w-3 text-zinc-400 transition-transform", open ? "rotate-180" : ""].join(" ")}
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </div>
      </button>

      {open && <div className="px-5 pb-5">{formContent}</div>}
    </div>
  );
}
