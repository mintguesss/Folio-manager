import { getUser } from "@/lib/supabase/server";
import { MAIN_NAV, MORE_NAV, TRIP_NAV, canSeeTrip } from "@/lib/nav";
import { HomeView } from "@/components/HomeView";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function greetingOf(hour: number) {
  if (hour < 5) return "還不睡啊";
  if (hour < 11) return "早安";
  if (hour < 14) return "午安";
  if (hour < 18) return "下午好";
  return "晚安";
}

/** 台灣時間（用 UTC 的 getter 讀） */
function taipeiNow() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

export default async function HomePage() {
  const user = await getUser();
  const items = canSeeTrip(user?.email) ? [...MAIN_NAV, TRIP_NAV] : MAIN_NAV;

  const t = taipeiNow();
  const dateLabel = `${t.getUTCMonth() + 1} 月 ${t.getUTCDate()} 日・星期${WEEK[t.getUTCDay()]}`;

  return <HomeView greeting={greetingOf(t.getUTCHours())} dateLabel={dateLabel} items={items} more={MORE_NAV} />;
}
