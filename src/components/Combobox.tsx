"use client";

import { useState, useEffect, useRef } from "react";

export function Combobox({
  name,
  options,
  defaultValue = "",
  placeholder = "",
  required = false,
  value: controlledValue,
  onChange: controlledOnChange,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function set(v: string) {
    if (!isControlled) setInternalValue(v);
    controlledOnChange?.(v);
  }

  const filtered =
    value === ""
      ? options
      : options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />
      <div className="flex">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            set(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full min-w-0 rounded-l-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((v) => !v)}
          className="flex-shrink-0 rounded-r-xl border border-l-0 border-white/10 bg-black/30 px-2.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>
      </div>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-zinc-500">無符合選項，可直接輸入</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o}
                onMouseDown={(e) => {
                  e.preventDefault();
                  set(o);
                  setOpen(false);
                }}
                className={[
                  "cursor-pointer px-3 py-2 text-sm transition-colors",
                  value === o
                    ? "bg-sky-500/20 text-sky-200"
                    : "text-zinc-200 hover:bg-white/5",
                ].join(" ")}
              >
                {o}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
