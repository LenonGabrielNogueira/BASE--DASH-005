import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-emerald-600",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
