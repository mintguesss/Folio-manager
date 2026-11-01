"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/nav";

const MOODS = ["✨", "🚀", "💸", "🍜", "🎯", "🫡", "🌈", "🐢"];

/** 每天換一句 */
const QUOTES = [
  "今天要記點什麼？",
  "小錢記清楚，大錢自然來。",
  "花得開心，記得清楚。",
  "每一筆都是生活的足跡。",
  "存錢的第一步是知道錢去哪了。",
  "今天也辛苦了，喝杯好的吧。",
  "記帳不是省錢，是看清楚自己。",
];

/** 背景閃爍的小星星：[left%, top%, 大小px, 延遲s] */
const STARS: [number, number, number, number][] = [
  [8, 12, 3, 0], [22, 70, 2, 1.2], [38, 8, 2, 2.1], [55, 55, 3, 0.6],
  [63, 15, 2, 1.8], [72, 78, 2, 0.3], [88, 30, 3, 2.6], [95, 62, 2, 1.1],
];

/** 繞著轉的小星系，表情用功能的 */
function Orbit({ emojis }: { emojis: string[] }) {
  return (
    <div aria-hidden className="home-orbit relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
      <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />
      <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 shadow-[0_0_30px_rgba(167,139,250,0.6)]" />
      <div className="home-orbit-ring absolute inset-0">
        {emojis.slice(0, 4).map((e, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center text-lg sm:-ml-4 sm:-mt-4 sm:h-8 sm:w-8 sm:text-xl"
            style={{ transform: `rotate(${i * 90}deg) translateY(var(--orbit-r)) rotate(${-i * 90}deg)` }}
          >
            <span className="home-orbit-item">{e}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** 滑鼠 / 手指位置寫進 CSS 變數，光暈和傾斜都交給 CSS，不觸發 React re-render */
function track(e: React.PointerEvent<HTMLElement>) {
  const tile = (e.target as HTMLElement).closest<HTMLElement>("[data-tile]");
  if (!tile) return;
  const r = tile.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  tile.style.setProperty("--mx", `${x * 100}%`);
  tile.style.setProperty("--my", `${y * 100}%`);
  if (e.pointerType === "mouse") {
    tile.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    tile.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
  }
}

function reset(e: React.PointerEvent<HTMLElement>) {
  const tile = e.currentTarget;
  tile.style.setProperty("--rx", "0deg");
  tile.style.setProperty("--ry", "0deg");
}

function Tile({ item, index, big }: { item: NavItem; index: number; big?: boolean }) {
  return (
    <Link
      href={item.href}
      data-tile
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={reset}
      style={{ "--accent": item.accent, "--i": index } as React.CSSProperties}
      className={["home-tile group", big ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""].join(" ")}
    >
      <span className="home-tile-glow" aria-hidden />
      <span className="relative flex h-full flex-col justify-between gap-6">
        <span className="home-emoji">{item.emoji}</span>
        <span>
          <span className="flex items-center gap-1.5 text-base font-semibold text-white">
            {item.label}
            <svg className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
          <span className="mt-0.5 block text-xs text-zinc-400">{item.desc}</span>
        </span>
      </span>
    </Link>
  );
}

export function HomeView({
  greeting,
  dateLabel,
  dayIndex,
  items,
  more,
}: {
  greeting: string;
  dateLabel: string;
  /** 用來每天換一句小語 */
  dayIndex: number;
  items: NavItem[];
  more: NavItem[];
}) {
  // 點表情會轉一圈換一個
  const [spins, setSpins] = useState(0);

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* 背景慢慢飄的光 */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-80 overflow-visible">
        <div className="home-orb left-[5%] top-0 [--c:rgba(56,189,248,0.22)]" />
        <div className="home-orb right-[0%] top-10 [--c:rgba(167,139,250,0.22)] [animation-delay:-6s]" />
        <div className="home-orb left-[35%] top-24 [--c:rgba(52,211,153,0.16)] [animation-delay:-12s]" />
      </div>

      <header className="home-rise relative mb-7 flex items-center justify-between gap-4 pt-2" style={{ "--i": 0 } as React.CSSProperties}>
        {STARS.map(([x, y, size, delay], i) => (
          <span
            key={i}
            aria-hidden
            className="home-star"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDelay: `${delay}s` }}
          />
        ))}
        <div className="relative min-w-0">
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-500">{dateLabel}</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
          <span className="home-shine">{greeting}</span>
          <button
            type="button"
            aria-label="換個心情"
            onClick={() => setSpins((n) => n + 1)}
            className="home-mood select-none"
            style={{ transform: `rotate(${spins * 360}deg)` }}
          >
            {MOODS[spins % MOODS.length]}
          </button>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{QUOTES[dayIndex % QUOTES.length]}</p>
        </div>
        <Orbit emojis={items.map((i) => i.emoji)} />
      </header>

      <div className="grid auto-rows-[minmax(8.5rem,auto)] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item, i) => (
          <Tile key={item.href} item={item} index={i + 1} big={i === 0} />
        ))}
      </div>

      <details className="home-rise group/more mt-6" style={{ "--i": items.length + 1 } as React.CSSProperties}>
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
          其他
          <svg className="h-3.5 w-3.5 transition-transform group-open/more:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {more.map((item, i) => (
            <Tile key={item.href} item={item} index={i} />
          ))}
        </div>
      </details>
    </div>
  );
}
