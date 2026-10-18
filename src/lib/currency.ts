// 出國記帳 / 出國分帳 支援的幣別（client + server 共用，不要 import server-only 的東西）

/** 出國記帳每筆可選的幣別（含台幣，例如出國前在台灣付的） */
export const TRAVEL_CURRENCIES = ["JPY", "SGD", "TWD"] as const;
export type TravelCurrency = (typeof TRAVEL_CURRENCIES)[number];

/** 出國分帳群組可設定的外幣 */
export const GROUP_CURRENCIES = ["JPY", "SGD"] as const satisfies readonly TravelCurrency[];

type CurrencyInfo = {
  label: string;
  symbol: string;
  /** 外幣金額保留幾位小數（日圓 0、新幣 2） */
  decimals: number;
  /** Yahoo Finance 匯率代號與合理區間（超出區間視為錯誤資料） */
  fx: { symbol: string; fallback: number; min: number; max: number };
  payments: string[];
};

export const CURRENCY_INFO: Record<TravelCurrency, CurrencyInfo> = {
  JPY: {
    label: "日圓",
    symbol: "¥",
    decimals: 0,
    fx: { symbol: "JPYTWD=X", fallback: 0.217, min: 0.1, max: 1.0 },
    payments: ["信用卡", "現金", "Suica"],
  },
  SGD: {
    label: "新加坡幣",
    symbol: "S$",
    decimals: 2,
    fx: { symbol: "SGDTWD=X", fallback: 24, min: 15, max: 35 },
    payments: ["信用卡", "現金", "EZ-Link"],
  },
  TWD: {
    label: "台幣",
    symbol: "NT$",
    decimals: 0,
    fx: { symbol: "", fallback: 1, min: 0, max: 2 },
    payments: ["信用卡", "現金", "LinePay"],
  },
};

/** 未知或空值一律視為日圓（舊資料都是日圓） */
export function toTravelCurrency(v: unknown): TravelCurrency {
  return TRAVEL_CURRENCIES.includes(v as TravelCurrency) ? (v as TravelCurrency) : "JPY";
}

export function roundFx(n: number, cur: TravelCurrency): number {
  const p = 10 ** CURRENCY_INFO[cur].decimals;
  return Math.round(n * p) / p;
}

export function fmtFx(n: number, cur: TravelCurrency): string {
  const d = CURRENCY_INFO[cur].decimals;
  return CURRENCY_INFO[cur].symbol + new Intl.NumberFormat("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

/** 多幣別金額加總：{ JPY: 1200, SGD: 45.5 } */
export type FxBag = Partial<Record<TravelCurrency, number>>;

export function addFx(bag: FxBag, cur: TravelCurrency, n: number): FxBag {
  bag[cur] = (bag[cur] ?? 0) + n;
  return bag;
}

/** 單筆金額的外幣加總；台幣本身就是主要金額，不另外列 */
export function fxBagOf(cur: TravelCurrency, n: number): FxBag {
  return cur === "TWD" ? {} : { [cur]: n };
}

export function fmtFxBag(bag: FxBag): string {
  return TRAVEL_CURRENCIES
    .filter((c) => Math.abs(bag[c] ?? 0) >= 0.005)
    .map((c) => fmtFx(bag[c]!, c))
    .join(" · ");
}
