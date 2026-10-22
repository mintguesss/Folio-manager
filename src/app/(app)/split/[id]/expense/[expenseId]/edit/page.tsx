import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { updateSplitExpense } from "@/app/actions/split";
import { SplitExpenseForm } from "@/components/SplitExpenseForm";
import { toTravelCurrency } from "@/lib/currency";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const { data: group } = await supabase
    .from("split_groups")
    .select("id, name, group_type, currency")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const [{ data: expense }, { data: members }, { data: shares }, { data: myGroupUserRows }] = await Promise.all([
    supabase
      .from("split_expenses")
      .select("id, paid_by, description, amount, currency, expense_date, exchange_rate, split_type, category, payment_method, category_text, account, counterparty, note")
      .eq("id", expenseId)
      .eq("group_id", id)
      .single(),
    supabase
      .from("split_members")
      .select("id, name, is_self")
      .eq("group_id", id)
      .order("sort_order"),
    supabase
      .from("split_shares")
      .select("member_id, share_amount, is_settled")
      .eq("expense_id", expenseId),
    supabase.from("split_group_users").select("member_id").eq("group_id", id).eq("user_id", user?.id ?? "").limit(1),
  ]);

  if (!expense || !members) notFound();

  const selfMemberId =
    myGroupUserRows?.[0]?.member_id ?? (members ?? []).find((m) => m.is_self)?.id;

  const initialValues = {
    expense_date: expense.expense_date,
    description: expense.description ?? "",
    amount: Number(expense.amount),
    exchange_rate: expense.exchange_rate ? Number(expense.exchange_rate) : null,
    category: expense.category ?? "",
    payment_method: expense.payment_method ?? "",
    category_text: expense.category_text ?? "",
    account: expense.account ?? "",
    counterparty: expense.counterparty ?? "",
    note: expense.note ?? "",
    paid_by: expense.paid_by,
    split_type: (expense.split_type ?? "equal") as "equal" | "custom",
    shares: (shares ?? []).map((s) => ({
      member_id: s.member_id,
      share_amount: Number(s.share_amount),
      is_settled: s.is_settled,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/split/${id}`}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 transition-colors"
        >
          返回
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-white">修改支出</h1>
          <p className="text-xs text-zinc-400">
            {group.name}
            <span className="ml-1.5 rounded bg-white/5 px-1.5 py-0.5 text-zinc-500">
              {group.group_type === "travel" ? "出國" : "一般"}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <SplitExpenseForm
          groupId={group.id}
          groupType={group.group_type as "general" | "travel"}
          currency={toTravelCurrency(expense.currency !== "TWD" ? expense.currency : group.currency)}
          members={members}
          selfMemberId={selfMemberId}
          onCreate={updateSplitExpense}
          initialValues={initialValues}
          submitLabel="儲存修改"
          expenseId={expenseId}
        />
      </div>
    </div>
  );
}
