import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-white/95 px-3 py-2 text-sm shadow-[inset_0_1px_2px_rgba(14,77,146,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-600/90 dark:bg-slate-900/80 dark:text-slate-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
