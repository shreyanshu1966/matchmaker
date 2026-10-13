import { cn } from "@/lib/ui/cn";
import { initials } from "@/lib/ui/format";

/** Warm, hand-picked gradient pairs. A person always gets the same one. */
const GRADIENTS: [string, string][] = [
  ["#f6d0c9", "#d0665a"], // blush
  ["#efe2ed", "#824f7a"], // plum
  ["#f7ebcb", "#cca23f"], // gold
  ["#fde2d0", "#e07a4f"], // apricot
  ["#e3ece4", "#5f8b6c"], // sage
  ["#e2e6f3", "#5f6fa8"], // dusk
  ["#f4dde6", "#b55a7e"], // rose
  ["#e9e1f2", "#7b62a8"], // lavender
  ["#f1e4d6", "#9a6b45"], // cinnamon
  ["#dcecef", "#4f8a93"], // teal
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SIZES = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string;
  /** Stable key for the colour (defaults to the name) */
  seed?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [from, to] = GRADIENTS[hash(seed ?? name) % GRADIENTS.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-medium text-white ring-2 ring-white shadow-soft",
        SIZES[size],
        className,
      )}
      style={{ backgroundImage: `linear-gradient(140deg, ${from} -10%, ${to} 90%)` }}
    >
      <span className="drop-shadow-[0_1px_1px_rgb(0_0_0/0.15)]">{initials(name)}</span>
    </span>
  );
}
