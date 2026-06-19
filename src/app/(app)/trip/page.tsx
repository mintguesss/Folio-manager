import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripClient } from "@/components/TripClient";

const ALLOWED = ["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"];

export default async function TripPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!ALLOWED.includes(user?.email ?? "")) notFound();
  return <TripClient />;
}
