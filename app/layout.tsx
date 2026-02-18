import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "@/app/globals.css";
import { cn } from "@/lib/utils/cn";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PadelLog",
  description: "Modern tränings- och padelanalys för desktop och mobile."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={cn(plusJakarta.className, "min-h-screen")}>{children}</body>
    </html>
  );
}
