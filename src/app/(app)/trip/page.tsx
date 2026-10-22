import { notFound } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { TripClient } from "@/components/TripClient";

const ALLOWED = ["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"];

export default async function TripPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!ALLOWED.includes(user?.email ?? "")) notFound();
  return <TripClient />;
}
