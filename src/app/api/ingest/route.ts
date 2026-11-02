import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseNotification } from "@/lib/notify-parse";

// 手機（MacroDroid）收到付款通知時 POST 過來：
//   POST /api/ingest?key=<金鑰>
//   body：JSON {"title": "...", "text": "..."} 或表單 title=...&text=...（也接受放在網址參數）
// 不是付款通知的（抓不到金額）直接丟掉，不會存。

/** MacroDroid 沒抓到值時會把代號原封不動送來，例如 "{notification}"，當作空的 */
const unresolved = (v: string) => /^\{[\w=]+\}$/.test(v.trim());

async function readFields(req: NextRequest): Promise<{ title: string; text: string }> {
  // 除了 key 以外的參數都收：title 是標題，其餘（text、big、lines…）都接成內文，
  // 因為不同 App 的通知內容放在不同欄位
  const fields = new Map<string, string>();
  for (const [k, v] of req.nextUrl.searchParams) if (k !== "key") fields.set(k, v);
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const j = (await req.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(j)) if (v != null) fields.set(k, String(v));
    } else if (type.includes("form")) {
      const f = await req.formData();
      for (const [k, v] of f) fields.set(k, String(v));
    } else {
      const raw = await req.text();
      if (raw && !fields.has("text")) fields.set("text", raw);
    }
  } catch {}

  const ok = (v: string | undefined) => (v && !unresolved(v) ? v : "");
  const title = ok(fields.get("title"));
  const parts: string[] = [];
  for (const [k, v] of fields) {
    const val = ok(v).trim();
    if (k !== "title" && val && !parts.includes(val)) parts.push(val);
  }
  return { title: title.slice(0, 200), text: parts.join("\n").slice(0, 2000) };
}

export async function POST(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (key.length < 20) return NextResponse.json({ ok: false, error: "missing key" }, { status: 401 });

  const { title, text } = await readFields(req);
  const parsed = parseNotification(title, text);
  // 回傳收到的內容，方便在手機上看為什麼被跳過
  if (!parsed) return NextResponse.json({ ok: true, skipped: true, got: { title, text } });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("ingest_ledger_notification", {
    p_token: key,
    p_source: title || null,
    p_raw_text: text || title,
    p_amount: parsed.amount,
    p_merchant: parsed.merchant,
    p_account: parsed.account,
  });

  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  if (data === "bad_token") return NextResponse.json({ ok: false, error: "bad key" }, { status: 401 });
  // merged：和另一則通知是同一筆消費（例如 LINE Pay + 銀行），已併在一起
  return NextResponse.json({ ok: true, result: data, amount: parsed.amount, merchant: parsed.merchant });
}
