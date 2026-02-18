"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav";
import { PadelIcon } from "@/components/padel/PadelIcon";
import { cn } from "@/lib/utils/cn";

const MOBILE_ITEMS = NAV_ITEMS.slice(0, 4);

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-padel-line/70 bg-white/95 px-2 py-1.5 backdrop-blur lg:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center rounded-xl border px-1 py-2 text-[11px] font-semibold transition-all duration-200",
                  isActive
                    ? "border-padel-lime bg-primary text-primary-foreground shadow-glow-blue"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "mb-1 rounded-full p-1 transition-colors",
                    isActive ? "bg-padel-lime/90 text-padel-blue" : "bg-padel-court text-padel-blue-soft"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label.split(" ")[0]}
                {isActive ? <PadelIcon mode="ball" className="absolute -top-1.5 right-4 h-3 w-3" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
