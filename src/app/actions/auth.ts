"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 登入後只能導回站內頁面：next 來自網址參數，不擋的話有人能做一條「登入後跳到釣魚網站」的連結。
// "//evil.com" 和 "/\evil.com" 瀏覽器都會當成別的網域；空白與控制字元會被瀏覽器刪掉（"/\t/evil.com"），一併擋掉
function safeNext(raw: FormDataEntryValue | null): string {
  const next = String(raw ?? "");
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || /[\s\x00-\x1f\x7f]/.test(next)) {
    return "/dashboard";
  }
  return next;
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  // 如果 Supabase 啟用 email confirmation，這裡會需要使用者去信箱確認。
  return { ok: true as const, message: "註冊成功，請回到登入。" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

