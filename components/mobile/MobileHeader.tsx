import { Badge } from "@/components/ui/badge";

interface MobileHeaderProps {
  title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 mb-4 border-b bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">PadelLog</p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <Badge>Klar för pass</Badge>
      </div>
    </header>
  );
}
