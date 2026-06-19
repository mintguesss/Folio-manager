import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TravelEntryForm } from "@/components/TravelEntryForm";
import { fetchJPYTWD } from "@/lib/stock-utils";

export default async function EditTravelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: expense }, { data: tripsRaw }, rate] = await Promise.all([
    supabase
      .from("travel_expenses")
      .select("id,trip_name,occurred_on,category,description,amount_jpy,exchange_rate,payment_method")
      .eq("user_id", user.id)
      .eq("id", id)
      .single(),
    supabase.from("travel_expenses").select("trip_name").eq("user_id", user.id),
    fetchJPYTWD(),
  ]);

  if (!expense) redirect("/travel");

  const existingTrips = Array.from(
    new Set((tripsRaw ?? []).map((t) => t.trip_name))
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-white">修改支出</h1>
        <Link href="/travel" className="text-sm font-medium text-zinc-200 hover:underline">
          返回出國記帳
        </Link>
      </div>

      <TravelEntryForm
        rate={rate}
        existingTrips={existingTrips}
        initial={{
          id: expense.id,
          trip_name: expense.trip_name,
          occurred_on: expense.occurred_on,
          category: expense.category,
          description: expense.description,
          amount_jpy: Number(expense.amount_jpy),
          exchange_rate: Number(expense.exchange_rate),
          payment_method: expense.payment_method,
        }}
      />
    </div>
  );
}
