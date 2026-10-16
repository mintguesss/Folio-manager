"use client";

import { useState } from "react";
import { M, Check, Bullet, TimedItem, DayHeader, LocHead, TripHeader, TabBar, FilterPills } from "./shared";

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
      <DayHeader day={1} date="10/23 五" title="抵達 ➔ 牛車水 ➔ 小印度" />
      <TimedItem time="11:55">
        落地 <M q="Changi Airport Terminal 3">T3</M>，逛連通的{" "}
        <M q="Jewel Changi Airport">星耀樟宜 Jewel</M>，小逛 & 吃
        <M q="Song Fa Bak Kut Teh Jewel Changi Airport">松發</M>，看
        <M q="HSBC Rain Vortex">雨漩渦</M>（如果有時間），行李可寄放
      </TimedItem>
      <TimedItem time="14:00">
        搭捷運（轉車兩次，約 1 小時 10 分）去{" "}
        <M q="Hotel Chancellor@Orchard">飯店</M>放行李
      </TimedItem>
      <TimedItem time="15:30">
        坐捷運去 <M q="Chinatown Singapore">牛車水</M>（約 25 分）：
        <M q="Buddha Tooth Relic Temple">佛牙寺</M>（約 17:00 關門，建議先去）、逛逛{" "}
        <M q="Pagoda Street Singapore">Pagoda St</M> 找東西吃
      </TimedItem>
      <TimedItem time="18:00">
        <M q="Maxwell Food Centre">麥士威熟食中心</M>晚餐（
        <M q="Tian Tian Hainanese Chicken Rice Maxwell">天天海南雞飯</M> or 旁邊的{" "}
        <M q="Ah Tai Hainanese Chicken Rice">Ah Tai</M>）
      </TimedItem>
      <TimedItem time="19:30">
        搭捷運去 <M q="Little India Singapore">小印度</M>（紫線直達，約 15 分）：逛街、
        <M q="Mustafa Centre">Mustafa Centre</M> 買東西（24 小時營業），可以吃點煎餅啥的，如{" "}
        <M q="Al-Bismi Restaurant Singapore">Al-Bismi</M>（評價兩極）
      </TimedItem>
      <TimedItem time="21:30">搭捷運回飯店（約 10 分）</TimedItem>
    </div>
  );
}

function Day2Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={2} date="10/24 六" title="環球影城 ➔ 聖淘沙" />
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

function Day3Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={3} date="10/25 日" title="甘榜格南 ➔ 烏節路 ➔ 濱海灣" />
      <TimedItem time="10:30">
        搭公車（約 25 分鐘）去 <M q="Kampong Glam">甘榜格南</M>：
        <M q="Sultan Mosque Singapore">蘇丹回教堂</M>（非穆斯林要避開禮拜時間）、
        <M q="Haji Lane">哈芝巷</M>，午餐（
        <M q="Zam Zam Restaurant Singapore">Zam Zam</M> 牛肉煎餅 murtabak）
      </TimedItem>
      <TimedItem time="13:30">
        回 <M q="Orchard Road">烏節路</M>逛街（
        <M q="Design Orchard">Design Orchard</M>、
        <M q="Charles & Keith ION Orchard">小 CK</M>）、休息
      </TimedItem>
      <TimedItem time="16:00">
        搭捷運（約 25 分）去 <M q="Merlion Park">魚尾獅公園</M>看夕陽
      </TimedItem>
      <TimedItem time="17:00">
        走去（30 分）濱海灣吃晚餐（
        <M q="Lau Pa Sat">Lau Pa Sat 沙嗲街</M>，很多好吃的，但記得帶現金）
      </TimedItem>
      <TimedItem time="19:45">
        <M q="Supertree Grove Gardens by the Bay">濱海灣花園超級樹</M>燈光秀（約 19:45、20:45），再逛{" "}
        <M q="OCBC Skyway">空中步道</M>
      </TimedItem>
      <TimedItem time="21:00">
        走去 <M q="Marina Bay Sands Event Plaza">金沙 Event Plaza</M> 看水舞秀 Spectra（免費，約 15 分鐘，20、21 點各一場）
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
      <DayHeader day={4} date="10/26 一" title="返程" />
      <TimedItem time="05:20">
        出門搭第一班捷運去 <M q="Changi Airport Terminal 1">T1</M>，約 06:30 到
      </TimedItem>
      <TimedItem time="06:45–07:30">逛免稅店</TimedItem>
      <TimedItem time="07:40">前到登機門（08:30 起飛）</TimedItem>
    </div>
  );
}

// ── Food ──────────────────────────────────────────────────────

type FoodLoc = "all" | "changi" | "chinatown" | "littleindia" | "sentosa" | "kampong" | "marina";

const FOOD_FILTERS: { id: FoodLoc; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "changi", label: "樟宜機場" },
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

      {show("changi") && (
        <>
          <LocHead>樟宜機場 Jewel</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><M q="Song Fa Bak Kut Teh Jewel Changi Airport">松發肉骨茶</M></Bullet>
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

// ── Tab definitions ───────────────────────────────────────────

type TabId = "checklist" | "d1" | "d2" | "d3" | "d4" | "food";

function getDefaultTab(): TabId {
  const now = new Date();
  const t = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  if (y === 2026 && m === 10) {
    const map: Record<number, TabId> = { 23: "d1", 24: "d2", 25: "d3", 26: "d4" };
    if (map[d]) return map[d];
  }
  return "d1";
}

const TABS: { id: TabId; top: string; bottom: string }[] = [
  { id: "checklist", top: "📋", bottom: "代辦" },
  { id: "d1", top: "Day 1", bottom: "10/23" },
  { id: "d2", top: "Day 2", bottom: "10/24" },
  { id: "d3", top: "Day 3", bottom: "10/25" },
  { id: "d4", top: "Day 4", bottom: "10/26" },
  { id: "food", top: "🍜", bottom: "吃" },
];

const CONTENT: Record<TabId, React.ReactNode> = {
  checklist: <ChecklistSection />,
  d1: <Day1Section />,
  d2: <Day2Section />,
  d3: <Day3Section />,
  d4: <Day4Section />,
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
        <p>📅 <span className="text-zinc-400">日期：</span>2026/10/23 (五) — 10/26 (一)</p>
        <p>🏨 <span className="text-zinc-400">住宿：</span>
          <M q="Hotel Chancellor@Orchard">Hotel Chancellor@Orchard（28 Cavenagh Rd）</M>
        </p>
        <p>🛫 <span className="text-zinc-400">去程：</span>長榮 BR225　TPE 07:30 → SIN T3 11:55</p>
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
