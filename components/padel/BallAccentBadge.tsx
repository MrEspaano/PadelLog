import { PadelIcon } from "@/components/padel/PadelIcon";
import { cn } from "@/lib/utils/cn";

interface BallAccentBadgeProps {
  label: string;
  className?: string;
}

export function BallAccentBadge({ label, className }: BallAccentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-padel-line/70 bg-padel-court px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-padel-blue",
        className
      )}
    >
      <PadelIcon mode="ball" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
