import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { fieldBase } from "./input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

/** Native select (best keyboard + mobile behaviour) with the app's styling. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(fieldBase, "h-10 cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
});
