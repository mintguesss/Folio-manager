"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const Money = z.coerce.number().finite().min(0).default(0);

const AssetSnapshotSchema = z.object({
  snapshot_date: z
    .string()
    .min(8)
    .transform((s) => s.trim()),
  total_assets: Money,
  bank_huanan: Money,
  bank_ctbc: Money,
  bank_post: Money,
  bank_taishin: Money,
  tw_stock_value: Money,
  us_stock_value: Money,
  note: z.string().optional().transform((s) => (s ? s.trim() : null)),
});

export async function upsertAssetSnapshot(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, message: "尚未登入。" };
  }

  const parsed = AssetSnapshotSchema.safeParse({
    snapshot_date: formData.get("snapshot_date"),
    total_assets: formData.get("total_assets"),
    bank_huanan: formData.get("bank_huanan"),
    bank_ctbc: formData.get("bank_ctbc"),
    bank_post: formData.get("bank_post"),
    bank_taishin: formData.get("bank_taishin"),
    tw_stock_value: formData.get("tw_stock_value"),
    us_stock_value: formData.get("us_stock_value"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };
  }

  const row = {
    user_id: user.id,
    snapshot_date: parsed.data.snapshot_date,
    total_assets: parsed.data.total_assets,
    bank_huanan: parsed.data.bank_huanan,
    bank_ctbc: parsed.data.bank_ctbc,
    bank_post: parsed.data.bank_post,
    bank_taishin: parsed.data.bank_taishin,
    tw_stock_value: parsed.data.tw_stock_value,
    us_stock_value: parsed.data.us_stock_value,
    note: parsed.data.note,
    breakdown: {},
  };

  const { error } = await supabase
    .from("asset_snapshots")
    .upsert(row, { onConflict: "user_id,snapshot_date" });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/assets");
  revalidatePath("/networth");
  revalidatePath("/dashboard");
  return { ok: true as const, message: "已儲存。" };
}

export async function deleteAssetSnapshot(formData: FormData) {
  const snapshot_date = String(formData.get("snapshot_date") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("asset_snapshots")
    .delete()
    .eq("user_id", user.id)
    .eq("snapshot_date", snapshot_date);

  if (error) return;

  revalidatePath("/assets");
  revalidatePath("/networth");
  revalidatePath("/dashboard");
  return;
}

