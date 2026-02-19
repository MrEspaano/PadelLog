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
    <header className="mat-surface mb-6 flex items-center justify-between rounded-2xl border border-padel-line/70 bg-white/85 px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="mt-1 rounded-full bg-padel-court p-2 text-padel-blue">
          <PadelIcon mode="racket" className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM", { locale: sv })}</p>
          {title !== "Översikt" ? <h2 className="font-display text-2xl font-semibold">{title}</h2> : null}
        </div>
      </div>

      <div className="text-right">
        <div className="mb-2 flex items-center justify-end gap-2">
          <ThemeToggle />
          <BallAccentBadge label="Match mode" />
        </div>
        <Badge variant="secondary">Inloggad</Badge>
        {userEmail ? <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p> : null}
      </div>
    </header>
  );
}
