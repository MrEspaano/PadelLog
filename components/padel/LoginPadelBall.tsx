"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

interface LoginPadelBallProps {
  className?: string;
}

export function LoginPadelBall({ className }: LoginPadelBallProps) {
  return (
    <div className={cn("pointer-events-none select-none", className)} aria-hidden="true">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 28, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
      >
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full drop-shadow-[0_16px_24px_rgba(14,77,146,0.28)]"
          fill="none"
        >
          <circle cx="60" cy="60" r="54" className="fill-padel-lime" />
          <circle cx="60" cy="60" r="54" className="stroke-padel-blue/50" strokeWidth="3.5" />

          <path d="M31 44c7.5-9.8 18.2-16 31.8-17.2" className="stroke-padel-blue/70" strokeWidth="4" strokeLinecap="round" />
          <path d="M58 89.8c13.7-1.4 24.5-7.4 32.2-17" className="stroke-padel-blue/70" strokeWidth="4" strokeLinecap="round" />

          <g className="fill-padel-blue/30">
            <circle cx="43" cy="52" r="3.3" />
            <circle cx="52" cy="39" r="3.2" />
            <circle cx="64.5" cy="72.5" r="3.6" />
            <circle cx="75.5" cy="60.5" r="3.1" />
            <circle cx="53.5" cy="83" r="2.9" />
            <circle cx="82.5" cy="45" r="2.8" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
