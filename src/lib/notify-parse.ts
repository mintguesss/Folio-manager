// 解析手機付款通知（銀行 / LINE Pay 的 LINE 訊息）成金額、商店、付款方式。
// 格式各家不同，這裡用寬鬆的規則；抓不到金額就當作不是付款通知。

export type ParsedNotification = {
  amount: number;
  merchant: string | null;
  account: string | null;
};

/** 一定要有這些字才算付款通知（避免把一般聊天訊息收進來） */
const PAY_WORDS = /(消費|刷卡|付款|支付|扣款|交易成功|交易通知|授權|Purchase|Payment)/i;
/** 退款、失敗、提醒類的不收 */
const SKIP_WORDS = /(退款|退貨|取消|失敗|未成功|繳款截止|帳單|優惠|活動|回饋|Refund|Cancel|Failed)/i;

// 有幣別標記的優先，最後才用「關鍵字後面的數字」
const AMOUNT_PATTERNS = [
  /(?:NT\$|NTD|TWD|新[臺台]幣|台幣)\s*([\d,]+(?:\.\d{1,2})?)/,
  /\$\s*([\d,]+(?:\.\d{1,2})?)/,
  /([\d,]+(?:\.\d{1,2})?)\s*元/,
  /(?:金額|消費|刷卡|付款|支付|扣款)\s*[：:]?\s*([\d,]+(?:\.\d{1,2})?)/,
];

const MERCHANT_PATTERNS = [
  // LINE Pay 英文通知：Merchant: 統一超商
  /Merchant\s*[：:]\s*([^\n，,。]+)/i,
  /(?:商店|特店|商家|店家|消費地點|交易對象|付款對象)\s*(?:名稱)?\s*[：:]\s*([^\n，,。]+)/,
  /(?:付款給|支付給|付給)\s*[：:]?\s*([^\n，,。]+)/,
  /於\s*([^\s，,。:：]+?)\s*(?:消費|刷卡|交易|付款)/,
  /在\s*([^\s，,。:：]+?)\s*(?:消費|刷卡|付款)/,
  /給\s*[：:]?\s*([^\n，,。]+)$/m,
];

/** 依通知來源（標題 / 內文）推測付款方式，名稱和一般記帳的選項一致 */
const ACCOUNT_RULES: [RegExp, string][] = [
  [/LINE\s*Pay|LINEPay/i, "LinePay"],
  [/中國信託|中信|CTBC/i, "中國信託"],
  [/華南/, "華南銀行"],
  [/國泰|CUBE/i, "國泰世華"],
  [/玉山/, "玉山銀行"],
  [/台新|Richart/i, "台新銀行"],
  [/富邦/, "富邦銀行"],
];

function clean(s: string) {
  return s
    .replace(/\s*(?:NT\$|NTD|TWD|新[臺台]幣|\$|金額).*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNotification(title: string, text: string): ParsedNotification | null {
  const body = `${title}\n${text}`;
  if (!PAY_WORDS.test(body) || SKIP_WORDS.test(body)) return null;
  // 通知標題（傳訊息的帳號）要是銀行 / LINE Pay 官方帳號，朋友傳的聊天訊息不收
  const account = ACCOUNT_RULES.find(([re]) => re.test(title))?.[1];
  if (!account) return null;

  let amount: number | null = null;
  for (const re of AMOUNT_PATTERNS) {
    const m = body.match(re);
    if (m) {
      const n = Number(m[1].replace(/,/g, ""));
      // 排除卡號末四碼、日期之類的誤判
      if (Number.isFinite(n) && n > 0 && n < 1_000_000) {
        amount = n;
        break;
      }
    }
  }
  if (amount === null) return null;

  let merchant: string | null = null;
  for (const re of MERCHANT_PATTERNS) {
    const m = text.match(re);
    if (m && clean(m[1]).length > 0) {
      merchant = clean(m[1]).slice(0, 60);
      break;
    }
  }

  return { amount, merchant, account };
}
