"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signInWithPassword, signUpWithPassword } from "@/app/actions/auth";

type ActionResult = { ok: true; message: string } | { ok: false; message: string } | undefined;

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 p-6 shadow-sm backdrop-blur">
      <h1 className="text-xl font-semibold text-white tracking-wide">{title}</h1>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200/90">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none ring-0 focus:border-white/25"
      />
    </label>
  );
}

export function LoginClient() {
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [loginState, loginAction, loginPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("next", next);
      return await signInWithPassword(formData);
    },
    undefined
  );

  const [signupState, signupAction, signupPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      return await signUpWithPassword(formData);
    },
    undefined
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-600/10 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] translate-x-1/3 rounded-full bg-violet-600/12 blur-[80px]" />
        <div className="absolute bottom-0 left-1/2 h-[250px] w-4/5 -translate-x-1/2 rounded-full bg-violet-900/20 blur-[60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 shadow-lg shadow-violet-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 17 7 11 11 14 15 7 21 13" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Folio Manager</h1>
          <p className="mt-1.5 text-sm text-zinc-400">個人財務與投資管理</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["股票記帳", "資產追蹤", "出國記帳", "一般記帳"].map((f) => (
              <span key={f} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={[
              "flex-1 rounded-xl px-4 py-2 text-sm font-medium",
              mode === "login"
                ? "bg-white/10 text-white border border-white/15"
                : "bg-black/20 text-zinc-300 border border-white/10 hover:bg-white/5",
            ].join(" ")}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={[
              "flex-1 rounded-xl px-4 py-2 text-sm font-medium",
              mode === "signup"
                ? "bg-white/10 text-white border border-white/15"
                : "bg-black/20 text-zinc-300 border border-white/10 hover:bg-white/5",
            ].join(" ")}
          >
            註冊
          </button>
        </div>

        {mode === "login" ? (
          <Card title="登入帳號">
            <form action={loginAction} className="space-y-4">
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field
                label="密碼"
                name="password"
                type="password"
                autoComplete="current-password"
              />
              {loginState?.message ? (
                <p
                  className={[
                    "text-sm",
                    loginState.ok ? "text-emerald-700" : "text-red-700",
                  ].join(" ")}
                >
                  {loginState.message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loginPending}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loginPending ? "登入中…" : "登入"}
              </button>
            </form>
            <p className="mt-4 text-xs text-zinc-400">
              若開啟了 email 驗證，註冊後需先到信箱確認。
            </p>
          </Card>
        ) : (
          <Card title="建立帳號">
            <form action={signupAction} className="space-y-4">
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field
                label="密碼（至少 6 碼）"
                name="password"
                type="password"
                autoComplete="new-password"
              />
              {signupState?.message ? (
                <p
                  className={[
                    "text-sm",
                    signupState.ok ? "text-emerald-700" : "text-red-700",
                  ].join(" ")}
                >
                  {signupState.message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={signupPending}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {signupPending ? "建立中…" : "註冊"}
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}


