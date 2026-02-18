import type { LucideIcon } from "lucide-react";
import { Activity, Dumbbell, Grid2x2, Home, Scale } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/padel", label: "Padel Wizard", icon: Activity },
  { href: "/weights", label: "Viktlogg", icon: Scale },
  { href: "/workouts", label: "Passlogg", icon: Grid2x2 },
  { href: "/coach", label: "Kritisk Coach", icon: Dumbbell }
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Översikt",
  "/padel": "Padel Wizard",
  "/weights": "Viktlogg",
  "/workouts": "Passlogg",
  "/coach": "Kritisk Coach"
};
