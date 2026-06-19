"use client";

import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-sky-400 hover:text-sky-300 transition-colors hover:underline underline-offset-2">
      {children}
    </a>
  );
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 text-base leading-none ${done ? "text-emerald-400" : "text-zinc-600"}`}>
        {done ? "✓" : "○"}
      </span>
      <span className={`text-base leading-relaxed ${done ? "text-zinc-500 line-through decoration-zinc-600" : "text-zinc-200"}`}>
        {children}
      </span>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
      <span className="text-base leading-relaxed text-zinc-300">{children}</span>
    </div>
  );
}

function TimedItem({ time, children }: { time: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-sky-300 whitespace-nowrap">
        {time}
      </span>
      <span className="text-base leading-relaxed text-zinc-300">{children}</span>
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-2 pb-0.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
      {children}
    </p>
  );
}

function DayHeader({ day, date, title }: { day: number; date: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-white/8 pb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-bold text-white shadow-lg">
        {day}
      </div>
      <div>
        <p className="text-xs text-zinc-500">{date}</p>
        <p className="text-lg font-semibold text-white">{title}</p>
      </div>
    </div>
  );
}

// ── Tab content sections ──────────────────────────────────────

function ChecklistSection() {
  return (
    <div className="space-y-3">
      <Check done>護照檢查：確認效期是否在 6 個月以上</Check>
      <Check done={false}>Visit Japan Web：出發前填好入境審查與海關申報，截圖 QR Code</Check>
      <Check done>役男出境申請</Check>
      <Check done>eSIM / SIM 卡預訂</Check>
      <Check done>河口湖腳踏車店尋找</Check>
      <Check done={false}>找吃的 & 逛的</Check>
      <Check done>和服店家 & 預約</Check>
      <Check done>
        04/22 (三) 09:00：搶 5/22《富士回遊》特急券（
        <A href="https://www.google.com/maps/search/?api=1&query=Shinjuku+Station">新宿</A>
        {" ↔ "}
        <A href="https://www.google.com/maps/search/?api=1&query=Kawaguchiko+Station">河口湖</A>
        ）。去程第一車 CD座位 單數，回程第三車 AB座位 單數 4/26備用
      </Check>
      <div className="pt-2">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-rose-400/80">車票與門票預訂（重要！）</p>
        <div className="space-y-3">
          <Check done>
            5/12 23:00預計：搶 5/26{" "}
            <A href="https://www.google.com/maps/search/?api=1&query=SHIBUYA+SKY">Shibuya Sky</A>{" "}
            傍晚門票（17:00沒搶到訂下午2、3點左右也可以）
          </Check>
          <Check done>迪士尼門票：提前官網或 Klook/KKday 購買</Check>
          <Check done>
            suica（綠）：<A href="https://www.google.com/maps/search/?api=1&query=Narita+Airport">成田機場</A>
            地鐵入口找機台，500押金，剩下為可用的，Apple Wallet 可以直接買
          </Check>
        </div>
      </div>
    </div>
  );
}

function Day1Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={1} date="5/20 三" title="抵達秋葉原" />
      <TimedItem time="16:35">
        抵達機場（<A href="https://www.google.com/maps/search/?api=1&query=Narita+Airport">成田</A>）
      </TimedItem>
      <Bullet>領取「富士回遊」來回車票、買 Suica</Bullet>
      <Bullet>
        <span className="font-medium text-zinc-200">交通：</span>搭 Access 特急（アクセス特急）（橘色）到{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Asakusabashi+Station">淺草橋站</A>{" "}
        ➔ 轉 JR 中央線 ➔{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Station">秋葉原</A>
      </Bullet>
      <Bullet>
        <span className="font-medium text-zinc-200">晚上：</span>
        <A href="https://www.google.com/maps/search/?api=1&query=VIA+INN+AKIHABARA">VIA INN</A> Check-in。
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Electric+Town"> 秋葉原電器街</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=Yodobashi+Camera+Multimedia+Akiba"> Yodobashi</A> 覓食逛逛
      </Bullet>
    </div>
  );
}

function Day2Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={2} date="5/21 四" title="春日部小新巡禮 ➔ 晴空塔" />
      <TimedItem time="09:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Station">秋葉原</A>出發
      </TimedItem>
      <Bullet>
        <span className="font-medium text-zinc-200">交通：</span>日比谷線直通 /{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Kitasenju+Station">北千住</A>
        轉「東武晴空塔線」➔{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Kasukabe+Station">春日部站</A>（約 50 分鐘）
      </Bullet>
      <Bullet>11:00 前抵達，車站附近吃飯到 12:00</Bullet>
      <SubHead>景點（集章巡禮）</SubHead>
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%98%A5%E6%97%A5%E9%83%A8%E6%83%85%E5%A0%B1%E7%99%BA%E4%BF%A1%E9%A4%A8+%E3%81%B7%E3%82%89%E3%81%A3%E3%81%A8%E3%81%8B%E3%81%99%E3%81%8B%E3%81%B9">春日部發信館</A>（領卡、蓋章）
      </Bullet>
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%98%A5%E6%97%A5%E9%83%A8%E5%B8%82%E9%83%B7%E5%9C%9F%E8%B3%87%E6%96%99%E9%A4%A8">春日部鄉土館</A>（3 個章）
      </Bullet>
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%98%A5%E6%97%A5%E9%83%A8%E5%B8%82%E5%BD%B9%E6%89%80">春日部市役所</A>（小新雕像、3F 買明信片）
      </Bullet>
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=LaLa+Garden+Kasukabe">LaLa Garden</A>（3F 不理不理電影工作室）
      </Bullet>
      <TimedItem time="16:00">
        搭車前往 <A href="https://www.google.com/maps/search/?api=1&query=Oshiage+Station">押上站</A>（40 min）
      </TimedItem>
      <TimedItem time="17:00">
        逛 <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Solamachi">Solamachi</A>（迪士尼、三麗鷗、拉拉熊）
      </TimedItem>
      <TimedItem time="18:00">
        <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Skytree">晴空塔</A>（不上塔，只在下面逛逛）
        <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Solamachi"> Solamachi</A>
      </TimedItem>
    </div>
  );
}

function Day3Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={3} date="5/22 五" title="富士山河口湖單車行" />
      <TimedItem time="07:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Station">秋葉原</A> ➔{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Shinjuku+Station">新宿</A>（JR 總武線）
      </TimedItem>
      <TimedItem time="08:30→10:26">
        搭《富士回遊》（也可搭 07:30 → 09:28 看情況）
      </TimedItem>
      <TimedItem time="10:30–10:50">
        抵達 <A href="https://www.google.com/maps/search/?api=1&query=Kawaguchiko+Station">河口湖</A>，租電動腳踏車
      </TimedItem>
      <TimedItem time="10:50–11:15">
        前往 <A href="https://www.google.com/maps/search/?api=1&query=Arakura+Fuji+Sengen+Jinja+Shrine">新倉富士淺間神社</A>
      </TimedItem>
      <TimedItem time="11:15–12:35">
        <A href="https://www.google.com/maps/search/?api=1&query=Arakura+Fuji+Sengen+Jinja+Shrine">新倉富士淺間神社</A>
      </TimedItem>
      <TimedItem time="12:45–14:00">
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%9C%AC%E7%94%BA%E4%BA%8C%E4%B8%81%E7%9B%AE%E5%95%86%E5%BA%97%E8%A1%97+%E5%AF%8C%E5%A3%AB%E5%90%89%E7%94%B0">本町二丁目商店街</A>（
        <A href="https://www.google.com/maps/search/?api=1&query=Hikawa+Clock+Shop">日川時計店</A>拍街景）+ 吃飯
      </TimedItem>
      <TimedItem time="14:00–15:00">
        騎往 <A href="https://www.google.com/maps/search/?api=1&query=Oishi+Park">大石公園</A>（途經{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Nagasaki+Park+Kawaguchiko">長崎公園</A>及{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Lawson+Kawaguchiko+Station+Front">Lawson</A>，有空可以去）
      </TimedItem>
      <TimedItem time="15:00–16:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Oishi+Park">大石公園</A>（
        <A href="https://www.google.com/maps/search/?api=1&query=Oishi+Park+Cafe">Oishi Park Café</A>{" "}
        吃 CREMIA 冰淇淋，看富士山）
      </TimedItem>
      <TimedItem time="16:30–17:00">回程並還車</TimedItem>
      <TimedItem time="17:41→19:48">
        搭《富士回遊》回 <A href="https://www.google.com/maps/search/?api=1&query=Shinjuku+Station">新宿</A>
      </TimedItem>
    </div>
  );
}

function Day4Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={4} date="5/23 六" title="淺草 / 上野" />
      <Bullet>
        走到 <A href="https://maps.app.goo.gl/qkayvsu8Xq3ew4at6">神田町</A>搭銀座線直達
        <A href="https://www.google.com/maps/search/?api=1&query=Asakusa+Station"> 淺草</A>
      </Bullet>
      <Bullet>先穿和服（約 9、10 點左右）</Bullet>
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=Kaminarimon+Gate">雷門</A> /{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Asakusa+Shrine">淺草神社</A>
        （可以買良緣守一對），
        <A href="https://www.google.com/maps/search/?api=1&query=%E5%A4%A7%E9%BB%91%E5%A4%A9%E5%BE%A1%E5%AE%88+%E6%B7%BA%E8%8D%89"> 大黑天御守</A>
        （過了 <A href="https://www.google.com/maps/search/?api=1&query=Senso-ji">淺草寺</A>後再左轉找到一個「
        <A href="https://www.google.com/maps/search/?api=1&query=%E5%BD%B1%E5%90%91%E5%A0%82">影向堂（朱印所）</A>
        」但好像漲價很多）、
        <A href="https://www.google.com/maps/search/?api=1&query=%E5%90%89%E5%82%99%E5%AD%90%E5%B1%8B+%E6%B5%85%E8%8D%89"> 吉備子屋桃鈴</A>
      </Bullet>
      <Bullet>
        附近逛 & 吃（不能邊走邊吃？）：
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%B5%85%E8%8D%89%E3%83%A1%E3%83%B3%E3%83%81"> 浅草メンチ炸肉餅</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=%E6%B7%BA%E8%8D%89%E5%B8%83%E4%B8%81"> 淺草布丁</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=Suzukien+Asakusa"> 壽々喜園（抹茶）</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=%E3%82%AB%E3%83%8C%E3%83%AC%E3%81%A8%E3%82%A2%E3%82%A4%E3%82%B9+%E6%9D%B1%E4%BA%AC%E3%83%BB%E6%B5%85%E8%8D%89%E5%BA%97"> カヌレとアイス 東京・浅草店（甜點、冰淇淋）</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=%E9%8A%80%E8%8A%B1%E5%A0%82"> 銀花堂（草莓大福）</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=Sumida+Park"> 隅田公園</A>
        （無聊可以去，雖然櫻花應該沒了，可以拍拍
        <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Skytree"> 晴空塔</A>）
      </Bullet>
      <Bullet>
        晚餐前還和服，晚上可以去{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Ameyoko+Shopping+District">上野阿美橫町</A>
        （最好 7、8 點前）、
        <A href="https://www.google.com/maps/search/?api=1&query=Ueno+Park">上野公園</A>晃晃
      </Bullet>
    </div>
  );
}

function Day5Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={5} date="5/24 日" title="彈性時間" />
      <Bullet>
        <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Station">東京車站</A>買伴手禮
      </Bullet>
      <Bullet>
        可以逛街 or 郊區（
        <A href="https://www.google.com/maps/search/?api=1&query=Hakone">箱根</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=Atami">熱海</A>、
        <A href="https://www.google.com/maps/search/?api=1&query=Karuizawa">輕井澤</A>
        ）算了太遠了，看看想逛哪就去哪
      </Bullet>
    </div>
  );
}

function Day6Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={6} date="5/25 一" title="東京迪士尼樂園" />
      <Bullet>
        <span className="font-medium text-zinc-200">全天：</span>
        <A href="https://www.google.com/maps/search/?api=1&query=Tokyo+Disney+Resort">迪士尼</A>（Land 或 Sea）
      </Bullet>
      <Bullet>
        <span className="font-medium text-zinc-200">密技交通：</span>
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Station">秋葉原</A>（日比谷線）➔{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Hatchobori+Station">八丁堀站</A> ➔（JR 京葉線）➔{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Maihama+Station">舞濱站</A>
      </Bullet>
    </div>
  );
}

function Day7Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={7} date="5/26 二" title="明治神宮 ➔ 原宿 ➔ 澀谷" />
      <TimedItem time="9:00–10:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Meiji+Jingu">明治神宮</A>
        （晨間人較少，空氣最好）。交通：
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Station"> 秋葉原</A>
        搭 JR 山手線 ➔「<A href="https://www.google.com/maps/search/?api=1&query=Harajuku+Station">原宿站</A>」下車
      </TimedItem>
      <TimedItem time="10:30–12:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Takeshita+Street">原宿竹下通</A> &{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Omotesando">表參道</A>。
        從 <A href="https://www.google.com/maps/search/?api=1&query=Meiji+Jingu">明治神宮</A>出來剛好銜接竹下通。
        <A href="https://www.google.com/maps/search/?api=1&query=Harry+Potter+Store+Tokyo"> 哈利波特旗艦店</A>、午餐
      </TimedItem>
      <TimedItem time="12:30–13:00">
        散步或搭車前往 <A href="https://www.google.com/maps/search/?api=1&query=Shibuya+Station">澀谷</A>。
        可以沿著「<A href="https://www.google.com/maps/search/?api=1&query=Cat+Street+Tokyo">貓街（Cat Street）</A>」
        一路逛去澀谷，或是直接搭一站 JR 到 <A href="https://www.google.com/maps/search/?api=1&query=Shibuya+Station">澀谷站</A>
      </TimedItem>
      <TimedItem time="13:00–13:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Hachiko+Memorial+Statue">忠犬八公像</A> &{" "}
        <A href="https://www.google.com/maps/search/?api=1&query=Shibuya+Scramble+Crossing">澀谷十字路口（Scramble Crossing）</A>。
        一出澀谷站就會看到八公像，記得跟這隻全日本最紅的秋田犬合照。接著走過世界最大、最繁忙的「澀谷十字路口」，感受過馬路的人海震撼
      </TimedItem>
      <TimedItem time="13:30–15:30">
        <A href="https://www.google.com/maps/search/?api=1&query=Shibuya+PARCO">澀谷 Parco</A>（6F 玩家聖地）。
        重點目標：
        <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw"> Nintendo TOKYO（任天堂）</A>、
        <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw"> Pokemon Center Shibuya（寶可夢中心）</A>、
        <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw"> Capcom Store</A>
      </TimedItem>
      <TimedItem time="15:30–16:30">
        周邊好逛推薦（等待夜景的空檔）。
        <A href="https://maps.app.goo.gl/AFC8tYb8em3ePdtH6"> MEGA 唐吉訶德 澀谷本店</A>：
        全日本最大級別，伴手禮、零食、免稅品一應俱全，這時間買完剛好傍晚
      </TimedItem>
      <TimedItem time="17:00–19:00">
        <A href="https://www.google.com/maps/search/?api=1&query=SHIBUYA+SKY">Shibuya Sky 展望台</A>。
        位於 <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw">Shibuya Scramble Square</A> 頂樓。
        5 月底東京日落大約在 18:44
      </TimedItem>
      <TimedItem time="19:00 後">
        晚餐與 <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw">澀谷</A>夜遊。吃晚餐，附近繼續逛逛
      </TimedItem>
    </div>
  );
}

function Day8Section() {
  return (
    <div className="space-y-3">
      <DayHeader day={8} date="5/27 三" title="秋葉原最後採購 ➔ 返家" />
      <Bullet>
        <span className="font-medium text-zinc-200">上午：</span>
        <A href="https://www.google.com/maps/search/?api=1&query=Akihabara+Electric+Town">秋葉原</A>最後模型、電器補貨
      </Bullet>
      <TimedItem time="10:00">
        搭山手線到 <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw">日暮里</A>
      </TimedItem>
      <Bullet>
        搭京成本線到 <A href="https://www.google.com/maps/search/?api=1&query=Narita+Airport">成田</A>（要不要換車皆可）
      </Bullet>
      <TimedItem time="14:30">飛機起飛</TimedItem>
    </div>
  );
}

const MISS_MSGS = [
  "想回日本了",
  "ig都是日本",
  "下次甚麼時候去",
  "下次一定看到富士山",
  "想吃炸牛排",
  "想喝冰水",
  "自動販賣機",
  "壽喜燒吃到飽",
  "新宿澀谷還沒逛完",
  "下次去北海道還是東京",
  "喝罐茶飲假裝在秋葉原",
  "想看夜景",
];

function Day9Section() {
  const day = useMemo(() => {
    const now = new Date();
    const t = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
    const start = Date.UTC(2026, 4, 28); // 2026-05-28
    return Math.max(1, Math.floor((today - start) / 86400000) + 1);
  }, []);

  const msg = MISS_MSGS[(day - 1) % MISS_MSGS.length];

  return (
    <div className="space-y-4">
      <DayHeader day={9} date="5/28～" title="想日本了 😢" />
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 text-center">
        <p className="text-6xl">😢</p>
        <div className="mt-5 flex items-baseline justify-center gap-3">
          <span className="text-sm font-semibold text-zinc-500">想日本了的第</span>
          <span className="text-6xl font-bold tabular-nums text-white leading-none">{day}</span>
          <span className="text-2xl font-bold text-zinc-300">天</span>
        </div>
        <p className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400 italic">
          「{msg}」
        </p>
      </div>
    </div>
  );
}

function GiftSection() {
  return (
    <div className="space-y-3">
      <Bullet>
        <A href="https://maps.app.goo.gl/MSxCgjuT6qXZCZL28">Cow Cow Kitchen Atre 秋葉原 1 店</A>：
        東京都千代田區外神田 1-17-6 Atre 秋葉原 1 1 樓
      </Bullet>
      <SubHead>東京車站</SubHead>
      <Bullet>
        <A href="https://maps.app.goo.gl/DzKe3pUfMZfchiwQ6">NEWYORK PERFECT CHEESE 東京南通路店</A>：
        日本〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1 Chome−9−1 JR Tokyo Station, 1F 南通路
      </Bullet>
      <Bullet>
        <A href="https://maps.app.goo.gl/Bke52xjAUvieM11k9">THE CAMPANELLA TOKYO 東京晴空戀巧</A>：
        日本〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1 Chome−9−1 JR Tokyo Station, 構内 1 階
      </Bullet>
      <SubHead>成田機場</SubHead>
      <Bullet>
        <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw">YOKU MOKU（雪茄蛋捲）</A>：成田機場・
        <A href="https://gemini.google.com/app/eb6e41b4e662f958?_gl=1*sr07yb*_gcl_au*NDI3OTg1MDM3LjE3NjAzMjk2MTQuMTE0ODA1OTk4MC4xNzYwMzI5NzQ4LjE3NjAzMjk3NDg.*_ga*ODQyMjE3MDUwLjE3NjAzMjk2MTQ.*_ga_WC57KJ50ZZ*czE3NjAzMjk2MTMkbzEkZzEkdDE3NjAzMjk3NTMkajMzJGwwJGgw">Fa-So-La TAX FREE AKIHABARA</A>
      </Bullet>
    </div>
  );
}

// ── Food location header ──────────────────────────────────────

function LocHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-3 first:pt-0">
      <span className="text-lg">📍</span>
      <span className="text-lg font-bold text-white">{children}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

type FoodLoc = "all" | "akihabara" | "kasukabe" | "kawaguchiko" | "asakusa" | "tokyo" | "harajuku";

const FOOD_FILTERS: { id: FoodLoc; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "akihabara", label: "秋葉原" },
  { id: "kasukabe", label: "春日部" },
  { id: "kawaguchiko", label: "河口湖" },
  { id: "asakusa", label: "淺草/上野" },
  { id: "tokyo", label: "東京車站" },
  { id: "harajuku", label: "原宿/澀谷" },
];

function FoodSection() {
  const [loc, setLoc] = useState<FoodLoc>("all");
  const show = (id: FoodLoc) => loc === "all" || loc === id;

  return (
    <div className="space-y-1">
      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FOOD_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setLoc(f.id)}
            className={[
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              loc === f.id
                ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {show("akihabara") && (
        <>
          <LocHead>秋葉原</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><A href="https://maps.app.goo.gl/deLAhd4uF5FW6PpK9">炸牛排 Gyukatsu Motomura Akihabara Branch</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/J8owRY1sN6u8CC217">拉麵 福之軒</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/qMtymxxynzuSJK3k9">拉麵 Men Zin Saito</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/D3Di9YZPMfvbmoUL6">豬排 丸五豬排</A></Bullet>
          </div>
        </>
      )}

      {show("kasukabe") && (
        <>
          <LocHead>春日部</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><A href="https://maps.app.goo.gl/GmignoabqG67WjJf8">拉麵</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/3eLogZcJkKQgQaqa9">鮪魚飯</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/X5qCcFfyK1vLKsru9">咖哩飯</A></Bullet>
          </div>
        </>
      )}

      {show("kawaguchiko") && (
        <>
          <LocHead>河口湖（吃餺飥）</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><A href="https://maps.app.goo.gl/zj57WeAj5qnyYzRX9">餺飥店（注意時間）</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/G7qb6gwL8FgSFm74A">ほうとう（餺飥）不動 河口湖站前店</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/bDGUx71QZ963JUPJA">備用</A></Bullet>
          </div>
        </>
      )}

      {show("asakusa") && (
        <>
          <LocHead>淺草 / 上野</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><A href="https://www.google.com/maps/search/?api=1&query=%E6%B5%85%E8%8D%89%E3%83%A1%E3%83%B3%E3%83%81">浅草メンチ炸肉餅</A></Bullet>
            <Bullet><A href="https://www.google.com/maps/search/?api=1&query=%E6%B7%BA%E8%8D%89%E5%B8%83%E4%B8%81">淺草布丁</A></Bullet>
            <Bullet><A href="https://www.google.com/maps/search/?api=1&query=Suzukien+Asakusa">壽々喜園（抹茶）</A></Bullet>
            <Bullet><A href="https://www.google.com/maps/search/?api=1&query=%E3%82%AB%E3%83%8C%E3%83%AC%E3%81%A8%E3%82%A2%E3%82%A4%E3%82%B9+%E6%9D%B1%E4%BA%AC%E3%83%BB%E6%B5%85%E8%8D%89%E5%BA%97">カヌレとアイス 東京・浅草店（甜點、冰淇淋）</A></Bullet>
            <Bullet><A href="https://www.google.com/maps/search/?api=1&query=%E9%8A%80%E8%8A%B1%E5%A0%82">銀花堂（草莓大福）</A></Bullet>
            <Bullet>晚餐：<A href="https://maps.app.goo.gl/gg49Fiq84JcfkpLc7">月島文字燒</A>（上野，也可以在淺草吃）</Bullet>
          </div>
        </>
      )}

      {show("tokyo") && (
        <>
          <LocHead>東京車站 / 隨便</LocHead>
          <div className="space-y-2.5 pt-1">
            <Bullet><A href="https://maps.app.goo.gl/3qE3pp7osGkw2xk56">迴轉壽司 根室花丸 KITTE 丸之内店</A></Bullet>
            <Bullet><A href="https://maps.app.goo.gl/UMPcw3SGwEjnwjss7">利久牛舌</A></Bullet>
          </div>
        </>
      )}

      {show("harajuku") && (
        <>
          <LocHead>原宿 / 澀谷</LocHead>
          <div className="space-y-2.5 pt-1">
            {/* 新增餐廳範例：
            <Bullet><A href="https://maps.app.goo.gl/XXXXXXXX">店名（備註）</A></Bullet>
            */}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────

type TabId = "checklist" | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "d8" | "d9" | "gift" | "food";

function getDefaultTab(): TabId {
  const now = new Date();
  const t = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  if (y < 2026 || m < 5 || (m === 5 && d < 20)) return "d1";
  if (y === 2026 && m === 5) {
    const map: Record<number, TabId> = { 20: "d1", 21: "d2", 22: "d3", 23: "d4", 24: "d5", 25: "d6", 26: "d7", 27: "d8" };
    return map[d] ?? "d9";
  }
  return "d9";
}

const TABS: { id: TabId; top: string; bottom: string }[] = [
  { id: "checklist", top: "📋", bottom: "代辦" },
  { id: "d1", top: "Day 1", bottom: "5/20" },
  { id: "d2", top: "Day 2", bottom: "5/21" },
  { id: "d3", top: "Day 3", bottom: "5/22" },
  { id: "d4", top: "Day 4", bottom: "5/23" },
  { id: "d5", top: "Day 5", bottom: "5/24" },
  { id: "d6", top: "Day 6", bottom: "5/25" },
  { id: "d7", top: "Day 7", bottom: "5/26" },
  { id: "d8", top: "Day 8", bottom: "5/27" },
  { id: "d9", top: "😢", bottom: "想日本" },
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
  d8: <Day8Section />,
  d9: <Day9Section />,
  gift: <GiftSection />,
  food: <FoodSection />,
};

// ── Main component ────────────────────────────────────────────

export function TripClient() {
  const [active, setActive] = useState<TabId>(getDefaultTab);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-violet-500/10 backdrop-blur">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-violet-500" />
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold text-white">✈️ 2026 日本東京行</h1>
          <div className="mt-2.5 space-y-1 text-base text-zinc-300">
            <p>📅 <span className="text-zinc-400">日期：</span>2026/05/20 (三) — 05/27 (三)</p>
            <p>🏨 <span className="text-zinc-400">住宿：</span>
              <A href="https://www.google.com/maps/search/?api=1&query=VIA+INN+AKIHABARA">VIA INN AKIHABARA（秋葉原）</A>
            </p>
            <p>👥 <span className="text-zinc-400">成員：</span>3 人</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={[
                "shrink-0 rounded-2xl px-3.5 py-2 text-center transition-all",
                isActive
                  ? "bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-900/30"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              ].join(" ")}
            >
              <div className="text-sm font-semibold">{tab.top}</div>
              <div className={`text-xs ${isActive ? "text-white/70" : "text-zinc-500"}`}>{tab.bottom}</div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-5 backdrop-blur">
        {CONTENT[active]}
      </div>
    </div>
  );
}
