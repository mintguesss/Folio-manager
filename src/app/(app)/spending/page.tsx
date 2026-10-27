import { createClient, getUser } from "@/lib/supabase/server";
import { CURRENCY_INFO, toTravelCurrency, type TravelCurrency } from "@/lib/currency";
import { SpendingClient } from "@/components/SpendingClient";

/** 統計頁用的一筆支出（出國記帳 + 出國分帳整理成同一種格式） */
export type SpendItem = {
  id: string;
  trip: string;
  date: string;
  description: string;
  category: string;
  /** 付款方式；別人付的分帳是 null */
  payment: string | null;
  source: "travel" | "split";
  currency: TravelCurrency;
  /** 我自己分攤的部分（台幣 / 原幣） */
  mineTwd: number;
  mineFx: number;
  /** 從我這邊付出去的錢（含幫別人先付的），對信用卡帳單用 */
  paidTwd: number;
  paidFx: number;
  /** 其中幫別人先付、之後要從分帳收回的（台幣） */
  forOthersTwd: number;
};

function rateOf(cur: TravelCurrency, rate: unknown) {
  const r = Number(rate);
  return Number.isFinite(r) && r > 0 ? r : CURRENCY_INFO[cur].fx.fallback;
}

export default async function SpendingPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  // 三個查詢彼此無關，一起送
  const [{ data: travel }, { data: groups }, { data: myLinks }] = await Promise.all([
    supabase
      .from("travel_expenses")
      .select("id,trip_name,occurred_on,category,description,amount_jpy,currency,exchange_rate,payment_method,split_expense_id")
      .eq("user_id", user.id),
    // RLS 只會回傳看得到的群組
    supabase.from("split_groups").select("id,name,user_id").eq("group_type", "travel"),
    supabase.from("split_group_users").select("group_id,member_id").eq("user_id", user.id),
  ]);

  const groupIds = (groups ?? []).map((g) => g.id as string);
  const ownedIds = (groups ?? []).filter((g) => g.user_id === user.id).map((g) => g.id as string);

  const [{ data: splitRows }, { data: selfMembers }] = await Promise.all([
    groupIds.length > 0
      ? supabase
          .from("split_expenses")
          .select("id,group_id,description,amount,currency,exchange_rate,payment_method,account,category,category_text,expense_date,paid_by,split_shares(member_id,share_amount)")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as never[] }),
    // 自己建的群組可能沒有 split_group_users，改用 is_self 的成員
    ownedIds.length > 0
      ? supabase.from("split_members").select("id,group_id").in("group_id", ownedIds).eq("is_self", true)
      : Promise.resolve({ data: [] as { id: string; group_id: string }[] }),
  ]);

  // 每個群組裡「我」是哪個成員
  const meInGroup = new Map<string, string>();
  for (const m of selfMembers ?? []) meInGroup.set(m.group_id, m.id);
  for (const l of myLinks ?? []) meInGroup.set(l.group_id, l.member_id);
  const groupName = new Map((groups ?? []).map((g) => [g.id as string, g.name as string]));

  const items: SpendItem[] = [];

  for (const e of travel ?? []) {
    const cur = toTravelCurrency(e.currency);
    const fx = Number(e.amount_jpy);
    const twd = fx * rateOf(cur, e.exchange_rate);
    // 從分帳「上傳」過來的那筆：我的份已算在這裡，但刷卡金額改由分帳那筆算（才有包含幫別人付的）
    const uploaded = !!e.split_expense_id;
    items.push({
      id: `t-${e.id}`,
      trip: e.trip_name,
      date: e.occurred_on,
      description: e.description?.trim() || e.category?.trim() || "支出",
      category: e.category?.trim() || "其他",
      payment: e.payment_method?.trim() || "未填",
      source: "travel",
      currency: cur,
      mineTwd: twd,
      mineFx: fx,
      paidTwd: uploaded ? 0 : twd,
      paidFx: uploaded ? 0 : fx,
      forOthersTwd: 0,
    });
  }

  const uploadedSplitIds = new Set((travel ?? []).map((e) => e.split_expense_id).filter(Boolean));

  for (const e of splitRows ?? []) {
    const me = meInGroup.get(e.group_id);
    if (!me) continue;
    const cur = toTravelCurrency(e.currency);
    const isFx = e.currency !== "TWD";
    const rate = isFx ? rateOf(cur, e.exchange_rate) : 1;
    const shares = (e.split_shares ?? []) as { member_id: string; share_amount: number }[];
    const mine = shares.filter((s) => s.member_id === me).reduce((s, x) => s + Number(x.share_amount), 0);
    const iPaid = e.paid_by === me;
    if (mine === 0 && !iPaid) continue;

    const uploaded = uploadedSplitIds.has(e.id);
    // 已上傳、又不是我付的：出國記帳那筆就代表全部了
    if (uploaded && !iPaid) continue;
    const paid = iPaid ? Number(e.amount) : 0;
    items.push({
      id: `s-${e.id}`,
      trip: groupName.get(e.group_id) ?? "分帳",
      date: e.expense_date,
      description: e.description?.trim() || "分帳支出",
      category: (e.category || e.category_text)?.trim() || "其他",
      payment: iPaid ? ((e.payment_method || e.account)?.trim() || "未填") : null,
      source: "split",
      currency: isFx ? cur : "TWD",
      // 已上傳到出國記帳的，我的份由那筆算，這裡不重複
      mineTwd: uploaded ? 0 : mine * rate,
      mineFx: uploaded ? 0 : mine,
      paidTwd: paid * rate,
      paidFx: paid,
      forOthersTwd: iPaid ? Math.max(0, paid - mine) * rate : 0,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">出國花費統計</h1>
        <p className="mt-1 text-sm text-zinc-400">每趟出國我自己花了多少、花在哪、信用卡要繳多少。</p>
      </div>
      <SpendingClient items={items} />
    </div>
  );
}
