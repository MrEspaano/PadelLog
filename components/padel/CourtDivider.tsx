import { cn } from "@/lib/utils/cn";

interface CourtDividerProps {
  className?: string;
}

export function CourtDivider({ className }: CourtDividerProps) {
  return (
    <div className={cn("relative h-12 w-full overflow-hidden rounded-xl border border-padel-line/50", className)}>
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="h-full w-full">
        <rect x="0" y="0" width="1000" height="120" className="fill-padel-blue/5" />
        <line x1="0" y1="60" x2="1000" y2="60" className="stroke-padel-blue/15" strokeWidth="2" />
        <line x1="500" y1="8" x2="500" y2="112" className="stroke-padel-blue/15" strokeWidth="2" />
        <rect x="130" y="24" width="740" height="72" className="fill-transparent stroke-padel-blue/12" strokeWidth="2" />
      </svg>
    </div>
  );
}
