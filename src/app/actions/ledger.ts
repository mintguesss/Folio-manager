"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  revalidatePath("/dashboard");
  return { ok: true as const, message: "已新增。" };
}

export async function updateLedgerEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  revalidatePath("/dashboard");
  redirect("/ledger");
}

export async function deleteLedgerEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("ledger_entries").delete().eq("user_id", user.id).eq("id", id);
  revalidatePath("/ledger");
  revalidatePath("/dashboard");
  revalidatePath("/split", "layout");
}
