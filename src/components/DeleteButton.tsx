"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/** 放在 <form action={deleteXxx}> 裡。按第一下變成「確定刪除？」，幾秒內再按一次才真的送出。 */
export function DeleteButton({
  label = "刪除",
  confirmLabel = "確定刪除？",
  className = "rounded-lg px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/10",
}: {
  label?: string;
  confirmLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (pending) {
    return (
      <button type="button" disabled className={`${className} opacity-50`}>
        刪除中…
      </button>
    );
  }

  if (armed) {
    return (
      <button
        type="submit"
        className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-rose-500/20"
      >
        {confirmLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setArmed(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setArmed(false), 4000);
      }}
      className={className}
    >
      {label}
    </button>
  );
}
