import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseNotification } from "@/lib/notify-parse";

// 手機（MacroDroid）收到付款通知時 POST 過來：
//   POST /api/ingest?key=<金鑰>
//   body：JSON {"title": "...", "text": "..."} 或表單 title=...&text=...（也接受放在網址參數）
// 不是付款通知的（抓不到金額）直接丟掉，不會存。

async function readFields(req: NextRequest): Promise<{ title: string; text: string }> {
  const q = req.nextUrl.searchParams;
  let title = q.get("title") ?? "";
  let text = q.get("text") ?? "";
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const j = await req.json();
      title = String(j.title ?? title);
      text = String(j.text ?? text);
    } else if (type.includes("form")) {
      const f = await req.formData();
      title = String(f.get("title") ?? title);
      text = String(f.get("text") ?? text);
    } else {
      const raw = await req.text();
      if (raw && !text) text = raw;
    }
  } catch {}
  return { title: title.slice(0, 200), text: text.slice(0, 2000) };
}

export async function POST(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (key.length < 20) return NextResponse.json({ ok: false, error: "missing key" }, { status: 401 });

  const { title, text } = await readFields(req);
  const parsed = parseNotification(title, text);
  if (!parsed) return NextResponse.json({ ok: true, skipped: true });

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
  return NextResponse.json({ ok: true, amount: parsed.amount, merchant: parsed.merchant });
}
