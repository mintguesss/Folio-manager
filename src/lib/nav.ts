/** 可以看行程頁的帳號 */
export const TRIP_USERS = ["a03111006@gmail.com", "xuziwei04@gmail.com", "yuyu09170917yuyu@gmail.com"];

export function canSeeTrip(email: string | null | undefined) {
  return TRIP_USERS.includes(email ?? "");
}

export type NavItem = { href: string; label: string; emoji: string; desc: string; /** 首頁卡片的主題色 */ accent: string };

/** 選單主項目 */
export const MAIN_NAV: NavItem[] = [
  { href: "/stocks", label: "股票記帳", emoji: "📈", desc: "買賣紀錄、持股損益", accent: "#34d399" },
  { href: "/ledger", label: "一般記帳", emoji: "🧾", desc: "日常收支", accent: "#38bdf8" },
  { href: "/travel", label: "出國記帳", emoji: "✈️", desc: "外幣支出、自動換算台幣", accent: "#a78bfa" },
  { href: "/split", label: "分帳", emoji: "🤝", desc: "群組分帳、誰欠誰", accent: "#fb7185" },
];

export const TRIP_NAV: NavItem = { href: "/trip", label: "行程", emoji: "🗺️", desc: "行程表、伴手禮、美食", accent: "#fbbf24" };

/** 收在「其他」裡的項目 */
export const MORE_NAV: NavItem[] = [
  { href: "/networth", label: "資產記帳", emoji: "💰", desc: "資產快照、淨值走勢", accent: "#2dd4bf" },
  { href: "/spending", label: "統計", emoji: "📊", desc: "每趟出國花了多少", accent: "#f472b6" },
  { href: "/auto-ledger", label: "自動記帳", emoji: "📱", desc: "付款通知自動進待確認", accent: "#60a5fa" },
];
