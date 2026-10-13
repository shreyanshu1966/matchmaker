import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "gold" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory " +
  "disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-plum-700 text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-6px_rgb(66_36_62/0.55)] hover:bg-plum-800",
  secondary: "bg-white text-ink ring-1 ring-line shadow-soft hover:bg-cream/60 hover:ring-sand",
  ghost: "text-ink-soft hover:bg-plum-50 hover:text-plum-800",
  soft: "bg-blush-50 text-blush-700 ring-1 ring-blush-100 hover:bg-blush-100",
  gold: "bg-gold-400 text-white shadow-[0_6px_16px_-6px_rgb(173_133_43/0.6)] hover:bg-gold-500",
  danger: "bg-white text-blush-700 ring-1 ring-blush-200 hover:bg-blush-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10",
  "icon-sm": "h-8 w-8",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
