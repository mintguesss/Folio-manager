"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { z } from "zod";
import { GROUP_CURRENCIES } from "@/lib/currency";

// ── Update Group ──────────────────────────────────────────────

const UpdateGroupMemberItem = z.object({
  db_id: z.string().uuid().optional(),
  name: z.string(),
  is_self: z.boolean(),
});

const UpdateGroupSchema = z.object({
  name: z.string().min(1).transform((s) => s.trim()),
  group_type: z.enum(["general", "travel"]),
  currency: z.enum(GROUP_CURRENCIES).catch("JPY"),
  description: z.string().optional().transform((s) => s?.trim() || null),
  members_json: z.string().transform((s) => {
    const arr = JSON.parse(s) as unknown[];
    return z.array(UpdateGroupMemberItem).parse(arr).filter((m) => m.name.trim());
  }),
});

export async function updateSplitGroup(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) return { ok: false as const, message: "缺少群組 ID。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = UpdateGroupSchema.safeParse({
    name: formData.get("name"),
    group_type: formData.get("group_type"),
    currency: formData.get("currency"),
    description: formData.get("description"),
    members_json: formData.get("members_json"),
  });
  if (!parsed.success) return { ok: false as const, message: "輸入格式不正確。" };

  const { name, group_type, currency, description, members_json } = parsed.data;

  const { error: groupError } = await supabase
    .from("split_groups")
    .update({ name, group_type, currency, description })
    .eq("id", groupId)
    .eq("user_id", user.id);
  if (groupError) return { ok: false as const, message: groupError.message };

  const existing = members_json.filter((m) => m.db_id);
  const added = members_json.filter((m) => !m.db_id);

  for (const m of existing) {
    await supabase
      .from("split_members")
      .update({ name: m.name.trim(), is_self: m.is_self })
      .eq("id", m.db_id!)
      .eq("group_id", groupId);
  }

  if (added.length > 0) {
    const { data: last } = await supabase
      .from("split_members")
      .select("sort_order")
      .eq("group_id", groupId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const startOrder = (last?.[0]?.sort_order ?? -1) + 1;
    await supabase.from("split_members").insert(
      added.map((m, i) => ({
        group_id: groupId,
        name: m.name.trim(),
        is_self: m.is_self,
        sort_order: startOrder + i,
      }))
    );
  }

  revalidatePath("/split");
  redirect(`/split/${groupId}`);
}

// ── Create Group ──────────────────────────────────────────────

const GroupSchema = z.object({
  name: z.string().min(1).transform((s) => s.trim()),
  group_type: z.enum(["general", "travel"]),
  currency: z.enum(GROUP_CURRENCIES).catch("JPY"),
  description: z.string().optional().transform((s) => s?.trim() || null),
  members_json: z.string().transform((s) => {
    const arr = JSON.parse(s) as { name: string; is_self: boolean }[];
    return arr.filter((m) => m.name.trim());
  }),
});

export async function createSplitGroup(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = GroupSchema.safeParse({
    name: formData.get("name"),
    group_type: formData.get("group_type"),
    currency: formData.get("currency"),
    description: formData.get("description"),
    members_json: formData.get("members_json"),
  });
  if (!parsed.success) return { ok: false as const, message: "輸入格式不正確。" };

  const { name, group_type, currency, description, members_json } = parsed.data;

  const { data: group, error: groupError } = await supabase
    .from("split_groups")
    .insert({ user_id: user.id, name, group_type, currency, description })
    .select("id")
    .single();
  if (groupError || !group) return { ok: false as const, message: groupError?.message ?? "建立失敗。" };

  if (members_json.length > 0) {
    const { data: createdMembers, error: membersError } = await supabase
      .from("split_members")
      .insert(
        members_json.map((m, i) => ({
          group_id: group.id,
          name: m.name.trim(),
          is_self: m.is_self,
          sort_order: i,
        }))
      )
      .select("id, is_self");
    if (membersError) return { ok: false as const, message: membersError.message };

    // Link group owner to their self member
    const selfMember = (createdMembers ?? []).find((m) => m.is_self);
    if (selfMember) {
      await supabase.from("split_group_users").insert({
        group_id: group.id,
        user_id: user.id,
        member_id: selfMember.id,
      });
    }
  }

  revalidatePath("/split");
  redirect(`/split/${group.id}`);
}

// ── Delete Group ──────────────────────────────────────────────

export async function deleteSplitGroup(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("split_groups").delete().eq("user_id", user.id).eq("id", id);
  revalidatePath("/split");
  redirect("/split");
}

// ── Create Expense ────────────────────────────────────────────

const ShareItem = z.object({
  member_id: z.string().uuid(),
  share_amount: z.number().finite(),
  is_settled: z.boolean(),
});

const trim = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : null);

const ExpenseSchema = z.object({
  group_id: z.string().uuid(),
  paid_by: z.string().uuid(),
  description: z.string().nullish().transform((s) => s?.trim() ?? ""),
  amount: z.coerce.number().positive().finite(),
  currency: z.string().min(1),
  expense_date: z.string().min(8),
  split_type: z.enum(["equal", "custom"]),
  category: z.string().nullish().transform(trim),
  exchange_rate: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  payment_method: z.string().nullish().transform(trim),
  category_text: z.string().nullish().transform(trim),
  account: z.string().nullish().transform(trim),
  counterparty: z.string().nullish().transform(trim),
  note: z.string().nullish().transform(trim),
  shares_json: z.string().transform((s) => {
    const arr = JSON.parse(s) as unknown[];
    return z.array(ShareItem).parse(arr);
  }),
});

export async function createSplitExpense(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = ExpenseSchema.safeParse({
    group_id: formData.get("group_id"),
    paid_by: formData.get("paid_by"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    expense_date: formData.get("expense_date"),
    split_type: formData.get("split_type"),
    category: formData.get("category"),
    exchange_rate: formData.get("exchange_rate"),
    payment_method: formData.get("payment_method"),
    category_text: formData.get("category_text"),
    account: formData.get("account"),
    counterparty: formData.get("counterparty"),
    note: formData.get("note"),
    shares_json: formData.get("shares_json"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues?.[0];
    const msg = issue ? `[${issue.path.join(".")}] ${issue.message}` : parsed.error.message;
    return { ok: false as const, message: msg };
  }

  const { group_id, shares_json, ...expenseData } = parsed.data;

  const { data: expense, error: expenseError } = await supabase
    .from("split_expenses")
    .insert({ group_id, ...expenseData })
    .select("id")
    .single();
  if (expenseError || !expense) return { ok: false as const, message: expenseError?.message ?? "建立失敗。" };

  if (shares_json.length > 0) {
    const { error: sharesError } = await supabase.from("split_shares").insert(
      shares_json.map((s) => ({
        expense_id: expense.id,
        member_id: s.member_id,
        share_amount: s.share_amount,
        is_settled: s.is_settled,
        settled_at: s.is_settled ? new Date().toISOString() : null,
      }))
    );
    if (sharesError) return { ok: false as const, message: sharesError.message };
  }

  revalidatePath(`/split/${group_id}`);
  redirect(`/split/${group_id}`);
}

// ── Update Expense ────────────────────────────────────────────

export async function updateSplitExpense(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const expenseId = String(formData.get("expense_id") ?? "");
  if (!expenseId) return { ok: false as const, message: "缺少支出 ID。" };

  const parsed = ExpenseSchema.safeParse({
    group_id: formData.get("group_id"),
    paid_by: formData.get("paid_by"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    expense_date: formData.get("expense_date"),
    split_type: formData.get("split_type"),
    category: formData.get("category"),
    exchange_rate: formData.get("exchange_rate"),
    payment_method: formData.get("payment_method"),
    category_text: formData.get("category_text"),
    account: formData.get("account"),
    counterparty: formData.get("counterparty"),
    note: formData.get("note"),
    shares_json: formData.get("shares_json"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues?.[0];
    const msg = issue ? `[${issue.path.join(".")}] ${issue.message}` : parsed.error.message;
    return { ok: false as const, message: msg };
  }

  const { group_id, shares_json, ...expenseData } = parsed.data;

  const { error } = await supabase
    .from("split_expenses")
    .update({ ...expenseData })
    .eq("id", expenseId);
  if (error) return { ok: false as const, message: error.message };

  await supabase.from("split_shares").delete().eq("expense_id", expenseId);
  if (shares_json.length > 0) {
    const { error: sharesError } = await supabase.from("split_shares").insert(
      shares_json.map((s) => ({
        expense_id: expenseId,
        member_id: s.member_id,
        share_amount: s.share_amount,
        is_settled: s.is_settled,
        settled_at: s.is_settled ? new Date().toISOString() : null,
      }))
    );
    if (sharesError) return { ok: false as const, message: sharesError.message };
  }

  revalidatePath(`/split/${group_id}`);
  redirect(`/split/${group_id}`);
}

// ── Delete Expense ────────────────────────────────────────────

export async function deleteSplitExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const group_id = String(formData.get("group_id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("split_expenses").delete().eq("id", id);
  revalidatePath(`/split/${group_id}`);
}

// ── Export Split Expense to Ledger ───────────────────────────

export async function exportSplitToLedger(formData: FormData) {
  const expenseId = String(formData.get("expense_id") ?? "");
  if (!expenseId) return { ok: false as const, message: "缺少支出 ID。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const { data: expense } = await supabase
    .from("split_expenses")
    .select("id, group_id, description, currency, expense_date, exchange_rate, category, payment_method, category_text, account, counterparty, note")
    .eq("id", expenseId)
    .single();
  if (!expense) return { ok: false as const, message: "找不到支出。" };

  const { data: group } = await supabase
    .from("split_groups")
    .select("id, name, group_type")
    .eq("id", expense.group_id)
    .single();
  if (!group) return { ok: false as const, message: "找不到群組。" };

  // Find current user's member: split_group_users first, then fall back to is_self flag
  const { data: myGroupUserRows } = await supabase
    .from("split_group_users")
    .select("member_id")
    .eq("group_id", expense.group_id)
    .eq("user_id", user.id)
    .limit(1);
  let selfMemberId = myGroupUserRows?.[0]?.member_id ?? null;

  if (!selfMemberId) {
    const { data: selfByFlag } = await supabase
      .from("split_members")
      .select("id")
      .eq("group_id", expense.group_id)
      .eq("is_self", true)
      .limit(1);
    selfMemberId = selfByFlag?.[0]?.id ?? null;
  }
  if (!selfMemberId) return { ok: false as const, message: "找不到你的成員。" };

  const { data: selfShare } = await supabase
    .from("split_shares")
    .select("share_amount, is_settled")
    .eq("expense_id", expenseId)
    .eq("member_id", selfMemberId)
    .single();
  if (!selfShare) return { ok: false as const, message: "找不到你的分攤紀錄。" };
  if (!selfShare.is_settled) return { ok: false as const, message: "此筆尚未結清。" };

  if (group.group_type === "travel") {
    if (!expense.exchange_rate) return { ok: false as const, message: "缺少匯率，無法新增。" };
    const { error } = await supabase.from("travel_expenses").insert({
      user_id: user.id,
      trip_name: group.name,
      occurred_on: expense.expense_date,
      category: expense.category ?? "其他",
      description: expense.description ?? null,
      amount_jpy: Number(selfShare.share_amount),
      currency: expense.currency,
      exchange_rate: Number(expense.exchange_rate),
      payment_method: expense.payment_method ?? null,
      split_expense_id: expenseId,
    });
    if (error) return { ok: false as const, message: error.message };
    revalidatePath("/travel");
  } else {
    const { error } = await supabase.from("ledger_entries").insert({
      user_id: user.id,
      occurred_on: expense.expense_date,
      entry_type: "expense",
      amount: Number(selfShare.share_amount),
      currency: "TWD",
      account: expense.account ?? null,
      category_text: expense.category_text ?? null,
      counterparty: expense.counterparty ?? null,
      memo: expense.description ?? expense.note ?? null,
      split_expense_id: expenseId,
    });
    if (error) return { ok: false as const, message: error.message };
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
  }

  revalidatePath(`/split/${expense.group_id}`);
  return { ok: true as const, message: "已新增到記帳。" };
}

// ── Toggle Share Settlement ───────────────────────────────────

export async function toggleSplitShare(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const group_id = String(formData.get("group_id") ?? "");
  const current = formData.get("is_settled") === "true";
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  const newSettled = !current;
  await supabase
    .from("split_shares")
    .update({
      is_settled: newSettled,
      settled_at: newSettled ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath(`/split/${group_id}`);
}

// ── Invite Member ─────────────────────────────────────────────

export async function inviteToSplitGroup(formData: FormData) {
  const group_id = String(formData.get("group_id") ?? "");
  const member_id = String(formData.get("member_id") ?? "");
  const invitee_email = String(formData.get("invitee_email") ?? "").trim().toLowerCase();

  if (!group_id || !member_id || !invitee_email)
    return { ok: false as const, message: "請填寫 Email。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  // Only group owner can invite
  const { data: group } = await supabase
    .from("split_groups")
    .select("id, user_id")
    .eq("id", group_id)
    .single();
  if (!group || group.user_id !== user.id) return { ok: false as const, message: "無權限。" };

  if (invitee_email === user.email?.toLowerCase())
    return { ok: false as const, message: "不能邀請自己。" };

  // Check if member is already linked to a user account
  const { data: alreadyLinked } = await supabase
    .from("split_group_users")
    .select("id")
    .eq("group_id", group_id)
    .eq("member_id", member_id)
    .limit(1);
  if ((alreadyLinked ?? []).length > 0)
    return { ok: false as const, message: "此成員已連結帳號。" };

  const { error } = await supabase.from("split_group_invites").upsert(
    { group_id, invited_by: user.id, invitee_email, member_id, status: "pending" },
    { onConflict: "group_id,invitee_email" }
  );
  if (error) return { ok: false as const, message: error.message };

  revalidatePath(`/split/${group_id}/members`);
  return { ok: true as const, message: "邀請已送出，對方登入後即可看到邀請通知。" };
}

// ── Accept Invite ─────────────────────────────────────────────

export async function acceptSplitGroupInvite(formData: FormData) {
  const invite_id = String(formData.get("invite_id") ?? "");
  if (!invite_id) return { ok: false as const, message: "缺少邀請 ID。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const { data: invite } = await supabase
    .from("split_group_invites")
    .select("id, group_id, member_id, invitee_email, status")
    .eq("id", invite_id)
    .single();

  if (!invite) return { ok: false as const, message: "找不到邀請。" };
  if (invite.status !== "pending") return { ok: false as const, message: "此邀請已處理。" };
  if (invite.invitee_email.toLowerCase() !== user.email?.toLowerCase())
    return { ok: false as const, message: "此邀請不是發給你的。" };

  const { error } = await supabase.from("split_group_users").insert({
    group_id: invite.group_id,
    user_id: user.id,
    member_id: invite.member_id,
  });
  if (error) return { ok: false as const, message: error.message };

  await supabase
    .from("split_group_invites")
    .update({ status: "accepted" })
    .eq("id", invite_id);

  revalidatePath("/split");
  redirect(`/split/${invite.group_id}`);
}

// ── Cancel Invite ─────────────────────────────────────────────

export async function cancelSplitGroupInvite(formData: FormData) {
  const invite_id = String(formData.get("invite_id") ?? "");
  const group_id = String(formData.get("group_id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("split_group_invites").delete().eq("id", invite_id);
  revalidatePath(`/split/${group_id}/members`);
}

// ── Settle / Unsettle All Shares ──────────────────────────────

export async function settleAllGroupShares(
  formData: FormData
): Promise<{ ok: boolean }> {
  const group_id = String(formData.get("group_id") ?? "");
  if (!group_id) return { ok: false };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false };

  // RLS enforces access — just fetch expense ids for the group
  const { data: expenses } = await supabase
    .from("split_expenses")
    .select("id")
    .eq("group_id", group_id);

  if (!expenses?.length) {
    revalidatePath(`/split/${group_id}`);
    return { ok: true };
  }

  const expenseIds = expenses.map((e) => e.id);
  await supabase
    .from("split_shares")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .in("expense_id", expenseIds)
    .eq("is_settled", false);

  revalidatePath(`/split/${group_id}`);
  return { ok: true };
}
