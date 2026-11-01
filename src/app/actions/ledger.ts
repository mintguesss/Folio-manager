"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { z } from "zod";

const EntrySchema = z.object({
  occurred_on: z.string().min(8),
  entry_type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().finite().positive(),
  account: z.string().optional().transform((s) => (s ? s.trim() : null)),
  category_text: z.string().optional().transform((s) => (s ? s.trim() : null)),
  counterparty: z.string().optional().transform((s) => (s ? s.trim() : null)),
  memo: z.string().optional().transform((s) => (s ? s.trim() : null)),
});

export async function createLedgerEntry(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = EntrySchema.safeParse({
    occurred_on: formData.get("occurred_on"),
    entry_type: formData.get("entry_type"),
    amount: formData.get("amount"),
    account: formData.get("account"),
    category_text: formData.get("category_text"),
    counterparty: formData.get("counterparty"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };
  }

  const { error } = await supabase.from("ledger_entries").insert({
    user_id: user.id,
    currency: "TWD",
    ...parsed.data,
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/ledger");
  return { ok: true as const, message: "已新增。" };
}

export async function updateLedgerEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = EntrySchema.safeParse({
    occurred_on: formData.get("occurred_on"),
    entry_type: formData.get("entry_type"),
    amount: formData.get("amount"),
    account: formData.get("account"),
    category_text: formData.get("category_text"),
    counterparty: formData.get("counterparty"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };
  }

  const { error } = await supabase
    .from("ledger_entries")
    .update({ currency: "TWD", ...parsed.data })
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/ledger");
  redirect("/ledger");
}

export async function deleteLedgerEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase.from("ledger_entries").delete().eq("user_id", user.id).eq("id", id);
  revalidatePath("/ledger");
  revalidatePath("/split", "layout");
}

// ── 手機通知自動匯入 ─────────────────────────────────────────

/** 通知收到的時間 → 台灣日期 */
function taipeiDate(iso: string) {
  return new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const AcceptSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().finite().positive(),
  merchant: z.string().max(100).transform((s) => s.trim()),
  category_text: z.string().max(40).transform((s) => s.trim()),
  account: z.string().max(40).transform((s) => s.trim()),
});

type InboxRow = { id: string; received_at: string };

async function bookInbox(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: InboxRow,
  v: { amount: number; merchant: string; category_text: string; account: string }
) {
  const { error } = await supabase.from("ledger_entries").insert({
    user_id: userId,
    occurred_on: taipeiDate(row.received_at),
    entry_type: "expense",
    amount: v.amount,
    currency: "TWD",
    account: v.account || null,
    category_text: v.category_text || null,
    counterparty: v.merchant || null,
  });
  if (error) return error;

  await Promise.all([
    supabase.from("ledger_inbox").update({ status: "done" }).eq("user_id", userId).eq("id", row.id),
    // 記住這家店的類別，下次自動帶入
    v.merchant && v.category_text
      ? supabase.from("ledger_merchant_rules").upsert({
          user_id: userId,
          merchant: v.merchant,
          category_text: v.category_text,
          account: v.account || null,
          updated_at: new Date().toISOString(),
        })
      : null,
  ]);
  return null;
}

export async function acceptInboxItem(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = AcceptSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    merchant: formData.get("merchant") ?? "",
    category_text: formData.get("category_text") ?? "",
    account: formData.get("account") ?? "",
  });
  if (!parsed.success) return { ok: false as const, message: "金額不正確。" };

  const { data: row } = await supabase
    .from("ledger_inbox")
    .select("id,received_at")
    .eq("user_id", user.id)
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .single();
  if (!row) return { ok: false as const, message: "找不到這筆。" };

  const error = await bookInbox(supabase, user.id, row, parsed.data);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/ledger");
  return { ok: true as const, message: "已入帳。" };
}

export async function ignoreInboxItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;
  await supabase.from("ledger_inbox").update({ status: "ignored" }).eq("user_id", user.id).eq("id", id);
  revalidatePath("/ledger");
}

/** 已經學過類別的店家一次全部入帳 */
export async function acceptKnownInbox() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  const [{ data: rows }, { data: rules }] = await Promise.all([
    supabase
      .from("ledger_inbox")
      .select("id,received_at,amount,merchant,account")
      .eq("user_id", user.id)
      .eq("status", "pending"),
    supabase.from("ledger_merchant_rules").select("merchant,category_text,account").eq("user_id", user.id),
  ]);
  const ruleMap = new Map((rules ?? []).map((r) => [r.merchant, r]));

  for (const r of rows ?? []) {
    const rule = r.merchant ? ruleMap.get(r.merchant) : undefined;
    if (!rule?.category_text || !r.amount) continue;
    await bookInbox(supabase, user.id, r, {
      amount: Number(r.amount),
      merchant: r.merchant!,
      category_text: rule.category_text,
      account: r.account || rule.account || "",
    });
  }
  revalidatePath("/ledger");
}

/** 產生手機用的金鑰（舊的立刻失效）。只回傳這一次，資料庫只存雜湊 */
export async function createIngestToken() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, token: "" };

  const { randomBytes, createHash } = await import("node:crypto");
  const token = randomBytes(24).toString("base64url");
  const token_hash = createHash("sha256").update(token).digest("hex");

  const { error } = await supabase
    .from("ingest_tokens")
    .upsert({ user_id: user.id, token_hash, created_at: new Date().toISOString() });
  if (error) return { ok: false as const, token: "" };
  return { ok: true as const, token };
}
