"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "modal" = centred card, "drawer" = full-height sheet from the right */
  variant?: "modal" | "drawer";
  className?: string;
  /** Extra content shown left of the title (e.g. an avatar) */
  leading?: React.ReactNode;
}

/**
 * Accessible dialog built on the native <dialog> element:
 * focus is moved inside and trapped by the browser, Esc closes,
 * the rest of the page becomes inert, and a backdrop click closes.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "modal",
  className,
  leading,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  const drawer = variant === "drawer";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clicking the backdrop targets the <dialog> element itself.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "bg-transparent p-0 text-ink open:flex",
        drawer
          ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-2xl open:animate-slide-in-right"
          : "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl open:animate-rise",
        className,
      )}
    >
      {open && (
        <div
          className={cn(
            "flex w-full flex-col overflow-hidden bg-ivory shadow-lift",
            drawer ? "h-full sm:rounded-l-3xl" : "max-h-[calc(100dvh-2rem)] rounded-3xl",
          )}
        >
          <header className="flex items-start gap-3 border-b border-line bg-white/70 px-5 py-4 sm:px-6">
            {leading}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-xl font-medium leading-tight text-ink">
                {title}
              </h2>
              {description && (
                <div id={descId} className="mt-0.5 text-sm text-ink-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 rounded-full p-2 text-ink-muted transition hover:bg-plum-50 hover:text-plum-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white/70 px-5 py-4 sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
