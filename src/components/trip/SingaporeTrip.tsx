"use client";

import { useMemo, useState } from "react";
import { M, Check, Bullet, TimedItem, SubHead, DayHeader, LocHead, TripHeader, TabBar, FilterPills } from "./shared";

// ── Tab content sections ──────────────────────────────────────

function ChecklistSection() {
  return (
    <div className="space-y-3">
      <Check done={false}>役男出境申請</Check>
      <Check done={false}>交通付款方式：買 EZ-Link 卡（10 SGD，裡面有 5 SGD 可用），先買或過去再買都行</Check>
      <Check done>各地點吃啥、買啥</Check>
      <Check done={false}>環球門票、滑道車門票、空中步道門票（如果要去）</Check>
      <Check done>SIM 卡</Check>
      <Check done={false}>換錢</Check>
      <Check done={false}>要帶的（如轉接頭）</Check>
      <Check done={false}>整理行李</Check>
    </div>
  );
}

function Day1Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={1} date="10/21 三" title="抵達" />
      <TimedItem time="20:45">
        落地（航廈待確認），出來可看 <M q="Jewel Changi Airport">星耀樟宜 Jewel</M>{" "}
        <M q="HSBC Rain Vortex">雨漩渦</M>（如果有時間，約開到 22:00），順便逛逛
      </TimedItem>
      <TimedItem time="22:30">
        搭捷運（<M q="Changi Airport MRT Station">樟宜機場</M> ➔{" "}
        <M q="Tanah Merah MRT Station">丹那美拉</M>轉車 ➔{" "}
        <M q="Lavender MRT Station">Lavender</M>，綠線約 40 分）去{" "}
        <M q="Hotel Boss Singapore">Hotel Boss</M>
      </TimedItem>
      <TimedItem time="23:15">入住，附近吃宵夜，早點睡</TimedItem>
    </div>
  );
}

function Day2Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={2} date="10/22 四" title="小印度 + 甘榜格南 + 夜間動物園" />
      <TimedItem time="07:30">
        自己走去 <M q="Little India Singapore">小印度</M>：
        <M q="Tekka Centre">竹腳中心（Tekka Centre）</M>吃早餐、逛街、
        <M q="Mustafa Centre">Mustafa Centre</M> 買東西（24 小時營業），可以吃點煎餅啥的，如{" "}
        <M q="Al-Bismi Restaurant Singapore">Al-Bismi</M>（評價兩極）
      </TimedItem>
      <TimedItem time="10:00">
        <M q="Bak Kut Teh near Hotel Boss Singapore">飯店樓下</M>吃肉骨茶
      </TimedItem>
      <TimedItem time="13:00">
        到 <M q="Hotel Boss Singapore">Hotel Boss</M> 會合
      </TimedItem>
      <TimedItem time="13:15">
        走路（約 10 分）去 <M q="Kampong Glam">甘榜格南</M>：
        <M q="Sultan Mosque Singapore">蘇丹回教堂</M>（非穆斯林要避開禮拜時間）、
        <M q="Haji Lane">哈芝巷</M>，午餐（
        <M q="Zam Zam Restaurant Singapore">Zam Zam</M> 牛肉煎餅 murtabak）
      </TimedItem>
      <TimedItem time="15:00">
        逛完可再回 <M q="Little India Singapore">小印度</M>走走，或回飯店休息
      </TimedItem>
      <TimedItem time="16:00">飯店附近吃晚餐</TimedItem>
      <TimedItem time="18:25">
        搭 Grab 去 <M q="Night Safari Singapore">夜間動物園</M>（約 30–35 分）
      </TimedItem>
      <TimedItem time="19:45">
        入園：先坐遊園車，再走步行路線，最後看表演（表演座位開演前 2 小時開放官網預約，選 21:00 以後的場次）
      </TimedItem>
      <TimedItem time="22:30">搭 Grab 回飯店（約 30 分）</TimedItem>
    </div>
  );
}

function Day3Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={3} date="10/23 五" title="換飯店 + 濱海灣" />
      <TimedItem time="11:00">
        <M q="Hotel Boss Singapore">Hotel Boss</M> 退房，搭捷運到{" "}
        <M q="Hotel Chancellor@Orchard">Chancellor</M> 寄放行李（約 30 分）
      </TimedItem>
      <TimedItem time="12:00">附近逛街、午餐</TimedItem>
      <TimedItem time="14:30">入住、休息</TimedItem>
      <TimedItem time="16:30">
        搭捷運（約 25 分）去 <M q="Merlion Park">魚尾獅公園</M>（白天拍照）
      </TimedItem>
      <TimedItem time="17:30">
        走去（30 分）濱海灣吃晚餐（
        <M q="Lau Pa Sat">Lau Pa Sat 沙嗲街</M>，很多好吃的，但記得帶現金）
      </TimedItem>
      <TimedItem time="19:45">
        <M q="Supertree Grove Gardens by the Bay">濱海灣花園超級樹</M>燈光秀（約 19:45、20:45），再逛{" "}
        <M q="OCBC Skyway">空中步道</M>
      </TimedItem>
      <TimedItem time="21:00">
        走去 <M q="Marina Bay Sands Event Plaza">金沙 Event Plaza</M> 看水舞秀 Spectra（免費，約 15 分鐘，20、21 點各一場，週五多一場 22 點）
      </TimedItem>
      <TimedItem time="21:30">
        搭捷運回 <M q="Orchard Road">烏節路</M>（約 25 分），買宵夜和伴手禮，出門晃晃
      </TimedItem>
    </div>
  );
}

function Day4Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={4} date="10/24 六" title="環球影城 ➔ 聖淘沙" />
      <TimedItem time="08:45">出發</TimedItem>
      <TimedItem time="10:00">
        <M q="Universal Studios Singapore">環球影城</M>開園，玩到傍晚
      </TimedItem>
      <TimedItem time="17:00">
        離開環球，搭 <M q="Sentosa Express">聖淘沙捷運</M>或公車去{" "}
        <M q="Beach Station Sentosa">海灘站</M>（約 10–15 分）
      </TimedItem>
      <TimedItem time="18:20">
        <M q="Skyline Luge Sentosa">滑道車 Skyline Luge</M> 取票（場次開始前 30 分鐘，憑 Trip.com 憑證，取票地點看憑證）
      </TimedItem>
      <TimedItem time="19:00">
        滑道車 3 趟（Trip.com 訂票 842，夜間 LED 滑道，週六營業到 21:00）
      </TimedItem>
      <TimedItem time="21:00">
        到 <M q="Siloso Beach Sentosa">聖淘沙海灘</M>一帶，晚餐（
        <M q="Coastes Sentosa">Coastes</M>，或其他也可，海邊整條有好幾家，代金券來不及買了）、海灘邊散步
      </TimedItem>
      <TimedItem time="22:00">
        聖淘沙捷運到 <M q="VivoCity">VivoCity</M>，轉捷運回{" "}
        <M q="Orchard Road">烏節路</M>（約 40 分，末班車時間出發前查）
      </TimedItem>
    </div>
  );
}

function Day5Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={5} date="10/25 日" title="牛車水 + 伴手禮" />
      <TimedItem time="10:30">
        坐捷運去 <M q="Chinatown Singapore">牛車水</M>（約 25 分）：
        <M q="Buddha Tooth Relic Temple">佛牙寺</M>（約 17:00 關門，建議先去）、逛逛{" "}
        <M q="Pagoda Street Singapore">Pagoda St</M> 找東西吃
      </TimedItem>
      <TimedItem time="11:00">
        <M q="Maxwell Food Centre">麥士威熟食中心</M>午餐（
        <M q="Tian Tian Hainanese Chicken Rice Maxwell">天天海南雞飯</M> or 旁邊的{" "}
        <M q="Ah Tai Hainanese Chicken Rice">Ah Tai</M>）
      </TimedItem>
      <TimedItem time="13:00">
        回 <M q="Orchard Road">烏節路</M>逛街（
        <M q="Design Orchard">Design Orchard</M>、
        <M q="Charles & Keith ION Orchard">小 CK</M>）、買伴手禮、休息
      </TimedItem>
      <TimedItem time="16:00">彈性安排</TimedItem>
    </div>
  );
}

function Day6Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={6} date="10/26 一" title="返程" />
      <TimedItem time="05:20">
        出門搭第一班捷運去 <M q="Changi Airport Terminal 1">T1</M>，約 06:30 到
      </TimedItem>
      <TimedItem time="06:45–07:30">逛免稅店</TimedItem>
      <TimedItem time="07:40 前">到登機門（08:30 起飛）</TimedItem>
    </div>
  );
}

// ── Food ──────────────────────────────────────────────────────

type FoodLoc = "all" | "lavender" | "chinatown" | "littleindia" | "sentosa" | "kampong" | "marina";

const FOOD_FILTERS: { id: FoodLoc; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "lavender", label: "Hotel Boss 周邊" },
  { id: "chinatown", label: "牛車水" },
  { id: "littleindia", label: "小印度" },
  { id: "sentosa", label: "聖淘沙" },
  { id: "kampong", label: "甘榜格南" },
  { id: "marina", label: "濱海灣" },
];

function FoodSection() {
  const [loc, setLoc] = useState<FoodLoc>("all");
  const show = (id: FoodLoc) => loc === "all" || loc === id;

  return (
    <div className="space-y-1">
      <FilterPills filters={FOOD_FILTERS} active={loc} onChange={setLoc} />

      {show("lavender") && (
        <>
          <LocHead>Hotel Boss 周邊</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Bak Kut Teh near Hotel Boss Singapore">飯店樓下肉骨茶</M></Bullet>
          </div>
        </>
      )}

      {show("chinatown") && (
        <>
          <LocHead>牛車水（麥士威熟食中心）</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Tian Tian Hainanese Chicken Rice Maxwell">天天海南雞飯</M></Bullet>
            <Bullet><M q="Ah Tai Hainanese Chicken Rice">Ah Tai 海南雞飯</M>（天天旁邊）</Bullet>
          </div>
        </>
      )}

      {show("littleindia") && (
        <>
          <LocHead>小印度</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Tekka Centre">竹腳中心 Tekka Centre</M>（早餐）</Bullet>
            <Bullet><M q="Al-Bismi Restaurant Singapore">Al-Bismi</M>（煎餅，評價兩極）</Bullet>
          </div>
        </>
      )}

      {show("sentosa") && (
        <>
          <LocHead>聖淘沙</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Coastes Sentosa">Coastes</M>（海邊整條有好幾家）</Bullet>
          </div>
        </>
      )}

      {show("kampong") && (
        <>
          <LocHead>甘榜格南</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Zam Zam Restaurant Singapore">Zam Zam</M>（牛肉煎餅 murtabak）</Bullet>
          </div>
        </>
      )}

      {show("marina") && (
        <>
          <LocHead>濱海灣</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Lau Pa Sat">Lau Pa Sat 沙嗲街</M>（記得帶現金）</Bullet>
          </div>
        </>
      )}
    </div>
  );
}

// ── Gift ──────────────────────────────────────────────────────

function GiftSection() {
  return (
    <div className="space-y-3">
      <SubHead>百勝廚 Prima Taste 叻沙拉麵</SubHead>
      <Bullet>
        <M q="FairPrice Orchard Singapore">FairPrice 超市</M>（確定有賣，4 包裝約 S$10–12）
      </Bullet>
      <Bullet>
        <M q="Mustafa Centre">Mustafa Centre</M>（Day 2 順便看，沒有再去 FairPrice）
      </Bullet>

      <SubHead>Aroma Truffle 松露洋芋片</SubHead>
      <Bullet>
        <M q="Aroma Truffle Bugis+">Bugis+</M>（Day 2 甘榜格南走過去約 10 分）
      </Bullet>
      <Bullet>
        <M q="Aroma Truffle Chinatown Point">Chinatown Point</M>（Day 5 牛車水順路）
      </Bullet>
      <Bullet>
        <M q="Aroma Truffle Jewel Changi Airport">星耀樟宜 Jewel</M>（Day 1 落地如果還開著）
      </Bullet>

      <SubHead>F.EAST 洋芋片（海南雞飯、叻沙口味）</SubHead>
      <Bullet>7-Eleven、<M q="FairPrice Orchard Singapore">FairPrice 超市</M>（可以跟叻沙拉麵一起買）</Bullet>

      <p className="pt-2 text-xs text-zinc-500">店家資訊是網路上舊資料，出發前再上官網確認。</p>
    </div>
  );
}

// ── 回來之後：新加坡紀念 ──────────────────────────────────

/** 遊記裡的片段，每天輪一則 */
const MEMORIES: { day: number; text: string }[] = [
  { day: 1, text: "出關超快，直奔 Jewel，剛好趕上雨漩渦看到關水" },
  { day: 2, text: "早餐的拉茶和 dosa，滿滿香料味完全吃不下" },
  { day: 3, text: "輪盤快輸光時，連中三把 8 倍" },
  { day: 4, text: "環球影城人超少，還好沒買快速通關" },
  { day: 1, text: "買 EZ-Link 卡時，下意識說了一句「はい」" },
  { day: 2, text: "Mustafa Centre 一路逛，掃拉麵和飲料" },
  { day: 3, text: "超市的拉麵比小印度便宜 3.55，氣死" },
  { day: 4, text: "玩完木乃伊就怕了，雲霄飛車不敢上" },
  { day: 1, text: "隔壁房跑來借刀，切一根超大香腸" },
  { day: 2, text: "哈芝巷的牛肉餅和炒飯還不錯" },
  { day: 3, text: "6 塊的草莓牛奶超好喝" },
  { day: 4, text: "水世界表演真不錯，下次坐前面（但會全濕）" },
  { day: 1, text: "冒出一隻蟑螂，叫人來抓，順便升級房間" },
  { day: 2, text: "蘇丹回教堂裡面很漂亮，但空空的" },
  { day: 3, text: "走去 F1 超遠，結果進不去 🫤" },
  { day: 4, text: "滑坡車上去的纜車好恐怖，可惜只能玩三趟" },
  { day: 1, text: "升級完打開窗戶是墓園，床對面還有一面超大鏡子" },
  { day: 2, text: "Grab 去夜間動物園，車上睡得超爽" },
  { day: 3, text: "松發肉骨茶好吃到再買盒裝帶回去" },
  { day: 4, text: "在 Google 攤位拿到帽子和小電風扇" },
  { day: 1, text: "洗澡每個角度都超燙，換個出水模式就好了，這啥" },
  { day: 2, text: "遊園車看到白虎、大象，還有一些根本不知道是什麼" },
  { day: 3, text: "擎天樹燈光秀和水舞，錄影拍不出現場的震撼" },
  { day: 4, text: "搭免費捷運去海邊看海、吃 Shake Shack" },
  { day: 1, text: "拿出御守擋一下，然後太累秒睡" },
  { day: 2, text: "步道說一小時，實際兩小時還迷路，最後狂飆趕表演" },
  { day: 3, text: "差 5 塊就回本，上頭全輸光" },
  { day: 4, text: "最後一杯 Mr Coconut 收尾" },
  { day: 2, text: "動物表演主持人帶得超好，兩萬多步腳好痛" },
  { day: 3, text: "賭桌旁一個超臭的屁，還以為誰拉屎了 💀" },
  { day: 3, text: "贏的錢剛好拿去付 20 塊的 Grab" },
];

const MEMORY_DATE: Record<number, string> = { 1: "10/21", 2: "10/22", 3: "10/23", 4: "10/24", 5: "10/25", 6: "10/26" };

function Day7Section() {
  const day = useMemo(() => {
    const now = new Date();
    const t = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
    const start = Date.UTC(2026, 9, 27); // 2026-10-27
    return Math.max(1, Math.floor((today - start) / 86400000) + 1);
  }, []);

  const mem = MEMORIES[(day - 1) % MEMORIES.length];

  return (
    <div className="space-y-4">
      <DayHeader day={7} date="10/27～" title="新加坡，玩過了 📸" />
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 text-center">
        <p className="text-6xl">🇸🇬</p>
        <p className="mt-4 inline-block -rotate-3 rounded-lg border-2 border-emerald-400/60 px-3 py-1 text-sm font-bold tracking-widest text-emerald-300">
          ✔ 已打卡
        </p>
        <div className="mt-5 flex items-baseline justify-center gap-3">
          <span className="text-sm font-semibold text-zinc-500">回來後第</span>
          <span className="text-6xl font-bold tabular-nums text-white leading-none">{day}</span>
          <span className="text-2xl font-bold text-zinc-300">天</span>
        </div>
        <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs tabular-nums text-zinc-500">
            📍 Day {mem.day} · {MEMORY_DATE[mem.day]}
          </p>
          <p className="mt-1.5 text-sm text-zinc-300 italic">「{mem.text}」</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────

type TabId = "checklist" | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "gift" | "food";

function getDefaultTab(): TabId {
  const now = new Date();
  const t = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  if (y === 2026 && m === 10) {
    const map: Record<number, TabId> = { 21: "d1", 22: "d2", 23: "d3", 24: "d4", 25: "d5", 26: "d6" };
    if (map[d]) return map[d];
  }
  if (y < 2026 || (y === 2026 && (m < 10 || (m === 10 && d < 21)))) return "d1";
  return "d7";
}

const TABS: { id: TabId; top: string; bottom: string }[] = [
  { id: "checklist", top: "📋", bottom: "代辦" },
  { id: "d1", top: "Day 1", bottom: "10/21" },
  { id: "d2", top: "Day 2", bottom: "10/22" },
  { id: "d3", top: "Day 3", bottom: "10/23" },
  { id: "d4", top: "Day 4", bottom: "10/24" },
  { id: "d5", top: "Day 5", bottom: "10/25" },
  { id: "d6", top: "Day 6", bottom: "10/26" },
  { id: "d7", top: "📸", bottom: "回憶" },
  { id: "gift", top: "🎁", bottom: "伴手禮" },
  { id: "food", top: "🍜", bottom: "吃" },
];

const CONTENT: Record<TabId, React.ReactNode> = {
  checklist: <ChecklistSection />,
  d1: <Day1Section />,
  d2: <Day2Section />,
  d3: <Day3Section />,
  d4: <Day4Section />,
  d5: <Day5Section />,
  d6: <Day6Section />,
  d7: <Day7Section />,
  gift: <GiftSection />,
  food: <FoodSection />,
};

// ── Main component ────────────────────────────────────────────

export function SingaporeTrip({ onShowPast }: { onShowPast: () => void }) {
  const [active, setActive] = useState<TabId>(getDefaultTab);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <TripHeader
        title="✈️ 2026 新加坡行"
        action={{ label: "🗾 以前行程", onClick: onShowPast }}
      >
        <p>📅 <span className="text-zinc-400">日期：</span>2026/10/21 (三) — 10/26 (一)</p>
        <p>🏨 <span className="text-zinc-400">住宿：</span>
          10/21–10/23 <M q="Hotel Boss Singapore">Hotel Boss（500 Jalan Sultan）</M>
        </p>
        <p className="pl-6">
          10/23–10/26 <M q="Hotel Chancellor@Orchard">Hotel Chancellor@Orchard（28 Cavenagh Rd）</M>
        </p>
        <p>🛫 <span className="text-zinc-400">去程：</span>訂位代號 U8LTSF　TPE 16:15 → SIN（落地時間、航廈待確認）</p>
        <p>🛬 <span className="text-zinc-400">回程：</span>酷航 TR874　SIN T1 08:30 → TPE 13:15</p>
        <p>👥 <span className="text-zinc-400">成員：</span>2 人</p>
      </TripHeader>

      <TabBar tabs={TABS} active={active} onChange={setActive} />

      <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-5 backdrop-blur">
        {CONTENT[active]}
      </div>
    </div>
  );
}
