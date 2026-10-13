import { forwardRef } from "react";
import { cn } from "@/lib/ui/cn";

export const fieldBase =
  "w-full rounded-xl bg-white px-3.5 text-sm text-ink ring-1 ring-line placeholder:text-ink-muted/80 shadow-[0_1px_0_rgb(66_36_62/0.03)] transition " +
  "hover:ring-sand focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-plum-400 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:ring-blush-400";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-ink-soft", className)} {...props} />;
}
