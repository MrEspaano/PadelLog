import { format } from "date-fns";
import { sv } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";

interface DesktopTopbarProps {
  title: string;
  userEmail?: string;
}

export function DesktopTopbar({ title, userEmail }: DesktopTopbarProps) {
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl border bg-white/70 p-4 backdrop-blur">
      <div>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM", { locale: sv })}</p>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>

      <div className="text-right">
        <Badge variant="secondary">Inloggad</Badge>
        {userEmail ? <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p> : null}
      </div>
    </header>
  );
}
