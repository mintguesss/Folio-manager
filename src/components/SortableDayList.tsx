"use client";

import { useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

/** 長按多久才開始拖曳（短按、捲動照常） */
const LONG_PRESS_MS = 300;

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        WebkitTouchCallout: "none",
      }}
      className={[
        disabled ? "" : "select-none",
        isDragging ? "relative z-10 rounded-xl opacity-90 shadow-2xl shadow-black/60 ring-1 ring-sky-400/40" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/**
 * 同一天的項目：長按後拖曳排順序。
 * 拖完先在畫面上換好，再呼叫 onReorder 存到資料庫；失敗就還原。
 */
export function SortableDayList<T extends { id: string }>({
  items,
  enabled,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  /** 有篩選條件時關掉（只看到部分項目，排出來的順序會亂） */
  enabled: boolean;
  onReorder: (ids: string[]) => Promise<{ ok: boolean }>;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
}) {
  // 本地暫存的新順序；伺服器資料更新後（id 組合改變）自動失效
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const itemIds = items.map((i) => i.id);
  const sameSet =
    localOrder !== null &&
    localOrder.length === itemIds.length &&
    itemIds.every((id) => localOrder.includes(id));
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = sameSet ? localOrder.map((id) => byId.get(id)!) : items;
  const orderedIds = ordered.map((i) => i.id);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: LONG_PRESS_MS, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: LONG_PRESS_MS, tolerance: 8 } })
  );

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(orderedIds, orderedIds.indexOf(String(active.id)), orderedIds.indexOf(String(over.id)));
    setLocalOrder(next);
    const res = await onReorder(next);
    if (!res.ok) setLocalOrder(null);
  }

  if (!enabled || items.length < 2) {
    return <div className={className}>{ordered.map((item) => <div key={item.id}>{renderItem(item)}</div>)}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={() => {
        try { navigator.vibrate?.(15); } catch {}
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ordered.map((item) => (
            <SortableRow key={item.id} id={item.id} disabled={false}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
