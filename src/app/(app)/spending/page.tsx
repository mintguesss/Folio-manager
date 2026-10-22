import { createClient, getUser } from "@/lib/supabase/server";
import { SpendingClient } from "@/components/SpendingClient";

export default async function SpendingPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  // Fetch travel expenses and user's group links in parallel
  const [{ data: travelExpenses }, { data: userGroupLinks }] = await Promise.all([
    supabase
      .from("travel_expenses")
      .select("id,occurred_on,amount_jpy,currency,exchange_rate,payment_method,category,description,split_expense_id")
      .eq("user_id", user.id),
    supabase
      .from("split_group_users")
      .select("group_id,member_id")
      .eq("user_id", user.id),
  ]);

  const linkedGroupIds = (userGroupLinks ?? []).map((l) => l.group_id as string);

  let travelGroupIds: string[] = [];
  let memberIds: string[] = [];

  if (linkedGroupIds.length > 0) {
    const { data: travelGroups } = await supabase
      .from("split_groups")
      .select("id")
      .in("id", linkedGroupIds)
      .eq("group_type", "travel");

    travelGroupIds = (travelGroups ?? []).map((g) => g.id as string);

    if (travelGroupIds.length > 0) {
      const primary = (userGroupLinks ?? [])
        .filter((l) => travelGroupIds.includes(l.group_id))
        .map((l) => l.member_id as string);

      if (primary.length > 0) {
        memberIds = primary;
      } else {
        // Group owner may not have a split_group_users row — fall back to is_self member
        const { data: selfMembers } = await supabase
          .from("split_members")
          .select("id")
          .in("group_id", travelGroupIds)
          .eq("is_self", true);
        memberIds = (selfMembers ?? []).map((m) => m.id as string);
      }
    }
  }

  // Fallback: owned groups not covered by split_group_users
  if (travelGroupIds.length === 0) {
    const { data: ownedTravel } = await supabase
      .from("split_groups")
      .select("id")
      .eq("user_id", user.id)
      .eq("group_type", "travel");
    travelGroupIds = (ownedTravel ?? []).map((g) => g.id as string);
    if (travelGroupIds.length > 0) {
      const { data: selfMembers } = await supabase
        .from("split_members")
        .select("id")
        .in("group_id", travelGroupIds)
        .eq("is_self", true);
      memberIds = (selfMembers ?? []).map((m) => m.id as string);
    }
  }

  let splitExpenses: SplitExpense[] = [];
  let splitShares: SplitShare[] = [];

  if (travelGroupIds.length > 0) {
    // Fetch ALL expenses for travel groups (not filtered by member)
    const { data: expenses } = await supabase
      .from("split_expenses")
      .select(
        "id,amount,currency,exchange_rate,payment_method,account,category,category_text,description,expense_date,paid_by"
      )
      .in("group_id", travelGroupIds);
    splitExpenses = expenses ?? [];

    // Fetch ALL shares for those expenses
    const expenseIds = splitExpenses.map((e) => e.id);
    if (expenseIds.length > 0) {
      const { data: shares } = await supabase
        .from("split_shares")
        .select("id,member_id,share_amount,is_settled,expense_id")
        .in("expense_id", expenseIds);
      splitShares = shares ?? [];
    }
  }

  const isOwner = ["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"].includes(user.email ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">花費統計</h1>
        <p className="mt-1 text-sm text-zinc-400">整合出國記帳與出國分帳的全部支出。</p>
      </div>
      <SpendingClient
        travelExpenses={travelExpenses ?? []}
        splitShares={splitShares}
        splitExpenses={splitExpenses}
        uploadedSplitIds={(travelExpenses ?? [])
          .map((e) => e.split_expense_id)
          .filter(Boolean) as string[]}
        memberIds={memberIds}
        isOwner={isOwner}
      />
    </div>
  );
}

export type SplitShare = {
  id: string;
  member_id: string;
  share_amount: number;
  is_settled: boolean;
  expense_id: string;
};
export type SplitExpense = {
  id: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  payment_method: string | null;
  account: string | null;
  category: string | null;
  category_text: string | null;
  description: string | null;
  expense_date: string;
  paid_by: string;
};
