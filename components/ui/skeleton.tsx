import { cn } from "@/lib/ui/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("shimmer rounded-xl", className)} {...props} />;
}
