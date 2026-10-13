import { Sparkles } from "lucide-react";
import type { CustomerStatus, MatchTier } from "@/lib/types";
import { cn } from "@/lib/ui/cn";
import { statusTone, tierTone } from "@/lib/ui/format";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-line bg-white text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

export function StatusPill({ status, className }: { status?: CustomerStatus; className?: string }) {
  const tone = statusTone(status);
  return (
    <Badge className={cn(tone.pill, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden="true" />
      {status ?? "New"}
    </Badge>
  );
}

export function TierBadge({ tier, className }: { tier: MatchTier; className?: string }) {
  const tone = tierTone(tier);
  return (
    <Badge className={cn(tone.pill, "font-semibold", className)}>
      {tier === "High Potential" && <Sparkles className="h-3 w-3" aria-hidden="true" />}
      {tier}
    </Badge>
  );
}

/** Small "AI" marker with a sparkle. */
export function AiBadge({ className, label = "AI" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-linear-to-r from-plum-600 to-blush-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}
