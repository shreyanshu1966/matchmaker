import { cn } from "@/lib/ui/cn";

/** Circular score indicator (0-100). */
export function ScoreRing({
  score,
  size = 64,
  stroke = 6,
  color = "#824f7a",
  label = "Match score",
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);

  return (
    <div
      role="img"
      aria-label={`${label}: ${value} out of 100`}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5ede4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-semibold text-ink"
        style={{ fontSize: Math.round(size * 0.3) }}
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}
