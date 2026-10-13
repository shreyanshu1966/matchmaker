"use client";

import { useRef } from "react";
import { cn } from "@/lib/ui/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number | null;
}

export function tabIds(idBase: string, value: string) {
  return { tab: `${idBase}-tab-${value}`, panel: `${idBase}-panel-${value}` };
}

/** WAI-ARIA tablist with roving focus (arrow keys, Home/End). */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  idBase,
  label,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onValueChange: (v: T) => void;
  idBase: string;
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onValueChange(items[next].value);
      refs.current[next]?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-full bg-cream/80 p-1 ring-1 ring-line [scrollbar-width:none]",
        className,
      )}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        const ids = tabIds(idBase, item.value);
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={ids.tab}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all sm:flex-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400",
              selected ? "bg-white text-plum-800 shadow-soft" : "text-ink-soft hover:text-plum-800",
            )}
          >
            {item.icon}
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  selected ? "bg-plum-100 text-plum-700" : "bg-white/70 text-ink-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idBase,
  value,
  active,
  children,
  className,
}: {
  idBase: string;
  value: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ids = tabIds(idBase, value);
  return (
    <div
      role="tabpanel"
      id={ids.panel}
      aria-labelledby={ids.tab}
      hidden={!active}
      tabIndex={0}
      className={cn("focus-visible:outline-none", active && "animate-fade-in", className)}
    >
      {children}
    </div>
  );
}
