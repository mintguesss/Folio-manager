import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssetForm } from "@/app/(app)/assets/AssetForm";

export default async function EditNetworthPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: snapshot } = await supabase
    .from("asset_snapshots")
    .select(
      "snapshot_date,total_assets,bank_huanan,bank_ctbc,bank_post,bank_taishin,tw_stock_value,us_stock_value,note"
    )
    .eq("user_id", user.id)
    .eq("snapshot_date", date)
    .single();

  if (!snapshot) redirect("/networth");

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-white">修改資產快照</h1>
        <Link href="/networth" className="text-sm font-medium text-zinc-200 hover:underline">
          返回資產記帳
        </Link>
      </div>

      <AssetForm
        defaults={{
          snapshot_date: snapshot.snapshot_date,
          total_assets: Number(snapshot.total_assets ?? 0),
          bank_huanan: Number(snapshot.bank_huanan ?? 0),
          bank_ctbc: Number(snapshot.bank_ctbc ?? 0),
          bank_post: Number(snapshot.bank_post ?? 0),
          bank_taishin: Number(snapshot.bank_taishin ?? 0),
          tw_stock_value: Number(snapshot.tw_stock_value ?? 0),
          us_stock_value: Number(snapshot.us_stock_value ?? 0),
          note: snapshot.note,
        }}
      />
    </div>
  );
}
