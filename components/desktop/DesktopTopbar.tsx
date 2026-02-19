import { format } from "date-fns";
import { sv } from "date-fns/locale";

import { BallAccentBadge } from "@/components/padel/BallAccentBadge";
import { PadelIcon } from "@/components/padel/PadelIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface DesktopTopbarProps {
  title: string;
  userEmail?: string;
}

export function DesktopTopbar({ title, userEmail }: DesktopTopbarProps) {
  return (
    <header className="mat-surface mb-4 flex items-center justify-between rounded-2xl border border-padel-line/70 bg-white/85 px-4 py-2 dark:border-slate-700/80 dark:bg-slate-900/78">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-padel-court p-2 text-padel-blue dark:bg-slate-800 dark:text-padel-blue-soft">
          <PadelIcon mode="racket" className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[15px] text-muted-foreground">{format(new Date(), "EEEE d MMMM", { locale: sv })}</p>
          {title !== "Översikt" ? <h2 className="font-display text-2xl font-semibold">{title}</h2> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground xl:inline">{userEmail}</span>
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <BallAccentBadge label="Match mode" />
        </div>
        <Badge variant="secondary">Inloggad</Badge>
      </div>
    </header>
  );
}
