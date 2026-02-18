import type { Metadata } from "next";
import { Barlow, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { cn } from "@/lib/utils/cn";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "PadelLog",
  description: "Modern tränings- och padelanalys för desktop och mobile."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={cn(barlow.variable, barlow.className, spaceGrotesk.variable, "min-h-screen")}>{children}</body>
    </html>
  );
}
