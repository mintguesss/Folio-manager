import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inviteToSplitGroup, cancelSplitGroupInvite } from "@/app/actions/split";
import { InviteMemberForm } from "@/components/InviteMemberForm";

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: group }, { data: members }, { data: invites }, { data: groupUsers }] =
    await Promise.all([
      supabase
        .from("split_groups")
        .select("id, name, group_type, user_id")
        .eq("id", id)
        .single(),
      supabase
        .from("split_members")
        .select("id, name, is_self")
        .eq("group_id", id)
        .order("sort_order"),
      supabase
        .from("split_group_invites")
        .select("id, member_id, invitee_email, status")
        .eq("group_id", id),
      supabase
        .from("split_group_users")
        .select("member_id, user_id")
        .eq("group_id", id),
    ]);

  if (!group) notFound();
  if (group.user_id !== user?.id) redirect(`/split/${id}`);

  const myMemberId =
    (groupUsers ?? []).find((gu) => gu.user_id === user?.id)?.member_id ??
    (members ?? []).find((m) => m.is_self)?.id;
  const linkedMemberIds = new Set((groupUsers ?? []).map((gu) => gu.member_id));
  const inviteByMember = new Map(
    (invites ?? []).filter((i) => i.member_id).map((i) => [i.member_id, i])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/split/${id}`}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
        >
          返回
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-white">管理成員</h1>
          <p className="text-xs text-zinc-400">{group.name}</p>
        </div>
      </div>

      <div className="space-y-3">
        {(members ?? []).map((m) => {
          const isMe = m.id === myMemberId;
          const isLinked = linkedMemberIds.has(m.id);
          const invite = inviteByMember.get(m.id);
          const linkedEmail =
            invite?.status === "accepted"
              ? invite.invitee_email
              : isMe
              ? user?.email
              : null;

          return (
            <div
              key={m.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{m.name}</span>
                {isMe && (
                  <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-xs text-sky-400">
                    你（擁有者）
                  </span>
                )}
                {!isMe && isLinked && (
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
                    已加入
                  </span>
                )}
                {!isMe && !isLinked && invite?.status === "pending" && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">
                    邀請中
                  </span>
                )}
                {linkedEmail && (
                  <span className="text-xs text-zinc-500">{linkedEmail}</span>
                )}
                {!isMe && !isLinked && invite?.status === "pending" && (
                  <span className="text-xs text-zinc-500">{invite.invitee_email}</span>
                )}
              </div>

              {!isMe && !isLinked && invite?.status === "pending" && (
                <form action={cancelSplitGroupInvite} className="mt-2">
                  <input type="hidden" name="invite_id" value={invite.id} />
                  <input type="hidden" name="group_id" value={id} />
                  <button
                    type="submit"
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    取消邀請
                  </button>
                </form>
              )}

              {!isMe && !isLinked && !invite && (
                <InviteMemberForm
                  groupId={id}
                  memberId={m.id}
                  onInvite={inviteToSplitGroup}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600">
        受邀者登入後，在「分帳」頁面會看到邀請通知，接受後即可共同管理此群組，各自新增支出到自己的記帳。
      </p>
    </div>
  );
}
