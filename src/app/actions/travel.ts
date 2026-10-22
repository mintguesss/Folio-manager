"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { z } from "zod";
import { TRAVEL_CURRENCIES } from "@/lib/currency";

const TravelExpenseSchema = z.object({
  trip_name: z
    .string()
    .min(1)
    .transform((s) => s.trim()),
  occurred_on: z.string().min(8),
  category: z
    .string()
    .min(1)
    .max(20)
    .transform((s) => s.trim()),
  description: z
    .string()
    .optional()
    .transform((s) => (s ? s.trim() : null)),
  amount_jpy: z.coerce.number().finite().min(0),
  currency: z.enum(TRAVEL_CURRENCIES).catch("JPY"),
  exchange_rate: z.coerce.number().finite().positive(),
  payment_method: z
    .string()
    .optional()
    .transform((s) => (s ? s.trim() : null)),
});

export async function createTravelExpense(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = TravelExpenseSchema.safeParse({
    trip_name: formData.get("trip_name"),
    occurred_on: formData.get("occurred_on"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount_jpy: formData.get("amount_jpy"),
    currency: formData.get("currency"),
    exchange_rate: formData.get("exchange_rate"),
    payment_method: formData.get("payment_method"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };
  }

  const { error } = await supabase.from("travel_expenses").insert({
    user_id: user.id,
    ...parsed.data,
  });

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/travel");
  return { ok: true as const, message: "已新增。" };
}

export async function updateTravelExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, message: "缺少 ID。" };

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { ok: false as const, message: "尚未登入。" };

  const parsed = TravelExpenseSchema.safeParse({
    trip_name: formData.get("trip_name"),
    occurred_on: formData.get("occurred_on"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount_jpy: formData.get("amount_jpy"),
    currency: formData.get("currency"),
    exchange_rate: formData.get("exchange_rate"),
    payment_method: formData.get("payment_method"),
  });

  if (!parsed.success) return { ok: false as const, message: "輸入格式不正確，請檢查欄位。" };

  const { error } = await supabase
    .from("travel_expenses")
    .update(parsed.data)
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/travel");
  redirect("/travel");
}

export async function deleteTravelExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return;

  await supabase
    .from("travel_expenses")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  revalidatePath("/travel");
  revalidatePath("/split", "layout");
}
