import { BallAccentBadge } from "@/components/padel/BallAccentBadge";
import { PadelIcon } from "@/components/padel/PadelIcon";

interface MobileHeaderProps {
  title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="mat-surface sticky top-0 z-20 mb-4 border-b border-padel-line/70 bg-white/90 px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-full bg-padel-court p-1.5 text-padel-blue">
            <PadelIcon mode="racket" className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">PadelLog</p>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
        </div>
        <BallAccentBadge label="Redo" />
      </div>
    </header>
  );
}
