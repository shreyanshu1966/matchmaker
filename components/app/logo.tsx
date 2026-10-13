import { cn } from "@/lib/ui/cn";

/** Two interlaced rings: two people, one introduction. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={cn("h-7 w-10", className)} aria-hidden="true" fill="none">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="26" cy="14" r="10" stroke="#e3887c" strokeWidth="2.5" />
      <path d="M20 6.2a10 10 0 0 1 0 15.6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        tone === "dark" ? "text-plum-800" : "text-white",
        className,
      )}
    >
      <LogoMark />
      <span className="font-display text-lg font-medium leading-none tracking-tight">
        TDC <span className="italic text-blush-500">Matchmaker</span>
      </span>
    </span>
  );
}
