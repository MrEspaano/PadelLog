import { cn } from "@/lib/utils/cn";

interface PadelIconProps {
  className?: string;
  mode?: "racket" | "ball" | "logo";
}

export function PadelIcon({ className, mode = "logo" }: PadelIconProps) {
  if (mode === "ball") {
    return (
      <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" className="fill-padel-lime stroke-padel-blue/50" strokeWidth="1.2" />
        <path d="M7.8 9.6C9.3 8 11 7.2 13.1 7" className="stroke-padel-blue/70" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M10.9 17c2.1-.2 3.8-1 5.3-2.6" className="stroke-padel-blue/70" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (mode === "racket") {
    return (
      <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" aria-hidden="true">
        <ellipse cx="10.5" cy="9.5" rx="6.2" ry="5.5" className="stroke-current" strokeWidth="1.5" />
        <path d="M13.8 13.6l4.9 4.9" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M18.7 18.5l1.8 1.8" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8.5" cy="8" r="0.7" className="fill-current" />
        <circle cx="11.7" cy="8" r="0.7" className="fill-current" />
        <circle cx="10.1" cy="10.8" r="0.7" className="fill-current" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 28" className={cn("h-6 w-6", className)} fill="none" aria-hidden="true">
      <ellipse cx="11" cy="10.5" rx="6.3" ry="5.6" className="stroke-current" strokeWidth="1.45" />
      <path d="M14.4 14.7l5.2 5.1" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19.6 19.8l2 2" className="stroke-current" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="21.2" cy="8.6" r="3.2" className="fill-padel-lime stroke-padel-blue" strokeWidth="1.1" />
      <path d="M19.7 7.5c.8-.8 1.6-1.2 2.7-1.2" className="stroke-padel-blue" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
