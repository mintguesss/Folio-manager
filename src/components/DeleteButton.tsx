"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

/** 放在 <form action={deleteXxx}> 裡。按下去先跳出確認視窗，按「刪除」才真的送出。
 *  不是刪除的確認（例如全部上傳）也可以用，換掉文字和確認鈕的樣式。 */
export function DeleteButton({
  label = "刪除",
  confirmLabel = "確定刪除？",
  message,
  confirmText = "刪除",
  pendingLabel = "刪除中…",
  className = "rounded-lg px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/10",
  armedClassName = "bg-rose-500 shadow-rose-500/30 hover:bg-rose-400",
}: {
  label?: string;
  /** 視窗標題 */
  confirmLabel?: string;
  /** 標題下面的說明 */
  message?: string;
  /** 確認鈕的字 */
  confirmText?: string;
  pendingLabel?: string;
  className?: string;
  /** 確認鈕的顏色 */
  armedClassName?: string;
}) {
  const { pending } = useFormStatus();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dialog.current?.showModal();
        }}
        className={pending ? `${className} opacity-50` : className}
      >
        {pending ? pendingLabel : label}
      </button>

      {/* <dialog> 在表單裡，裡面的 submit 鈕會送出這個表單；showModal 會蓋在整個畫面最上層 */}
      <dialog
        ref={dialog}
        onClick={(e) => {
          e.stopPropagation();
          // 點視窗外面的暗色背景就關掉
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="confirm-dialog m-auto w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-900 p-0 text-left text-zinc-100 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-5">
          <p className="text-base font-semibold text-white">{confirmLabel}</p>
          {message && <p className="mt-1.5 text-sm text-zinc-400">{message}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => dialog.current?.close()}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              取消
            </button>
            <button
              type="submit"
              onClick={() => dialog.current?.close()}
              className={["rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg", armedClassName].join(" ")}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
