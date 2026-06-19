"use client";

import { useActionState } from "react";

type ActionResult = { ok: boolean; message: string } | undefined;

export function InviteMemberForm({
  groupId,
  memberId,
  onInvite,
}: {
  groupId: string;
  memberId: string;
  onInvite: (fd: FormData) => Promise<ActionResult>;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (_prev, fd) => onInvite(fd),
    undefined
  );

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="member_id" value={memberId} />
      <div className="flex gap-2">
        <input
          name="invitee_email"
          type="email"
          placeholder="對方的 Email"
          required
          className="min-w-0 flex-1 rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "送出中…" : "邀請"}
        </button>
      </div>
      {state && (
        <p className={["text-xs", state.ok ? "text-emerald-400" : "text-red-400"].join(" ")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
