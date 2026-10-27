import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { TripClient } from "@/components/TripClient";
import { canSeeTrip } from "@/lib/nav";

export default async function TripPage() {
  const user = await getUser();
  if (!canSeeTrip(user?.email)) notFound();
  return <TripClient />;
}
