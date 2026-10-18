import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSplitGroup } from "@/app/actions/split";
import { SplitGroupForm } from "@/components/SplitGroupForm";
import { toTravelCurrency } from "@/lib/currency";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase
      .from("split_groups")
      .select("id, name, group_type, currency, description")
      .eq("id", id)
      .eq("user_id", user?.id ?? "")
      .single(),
    supabase
      .from("split_members")
      .select("id, name, is_self")
      .eq("group_id", id)
      .order("sort_order"),
  ]);

  if (!group) notFound();

  const initialValues = {
    name: group.name,
    group_type: group.group_type as "general" | "travel",
    currency: toTravelCurrency(group.currency),
    description: group.description ?? "",
    members: (members ?? []).map((m) => ({
      db_id: m.id,
      name: m.name,
      is_self: m.is_self,
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
          <h1 className="text-lg font-semibold text-white">修改群組</h1>
          <p className="text-xs text-zinc-400">{group.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
        <SplitGroupForm
          onCreate={updateSplitGroup}
          initialValues={initialValues}
          groupId={id}
        />
      </div>
    </div>
  );
}
