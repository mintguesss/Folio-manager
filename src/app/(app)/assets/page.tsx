export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // 舊路由相容：/assets -> /networth
  const { date } = await searchParams;
  const qp = date ? `?date=${encodeURIComponent(date)}` : "";
  const { redirect } = await import("next/navigation");
  redirect(`/networth${qp}`);
}

