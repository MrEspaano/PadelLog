"use client";

import { motion } from "framer-motion";

import type { WeightEntry } from "@/lib/types";

interface WeightTrendChartProps {
  entries: WeightEntry[];
}

export function WeightTrendChart({ entries }: WeightTrendChartProps) {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  if (ordered.length < 2) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-5 text-sm text-muted-foreground">
        Minst två vägningar krävs för trendgraf.
      </div>
    );
  }

  const weights = ordered.map((entry) => entry.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = ordered
    .map((entry, index) => {
      const x = (index / (ordered.length - 1)) * 100;
      const y = 100 - ((entry.weight_kg - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div className="h-44 rounded-lg bg-gradient-to-b from-accent-teal/10 to-accent-purple/10 p-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <polyline
            fill="none"
            stroke="rgb(13, 148, 136)"
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          {ordered.map((entry, index) => {
            const x = (index / (ordered.length - 1)) * 100;
            const y = 100 - ((entry.weight_kg - min) / range) * 100;
            return <circle key={entry.id} cx={x} cy={y} r="1.7" fill="rgb(124, 58, 237)" />;
          })}
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Min: {min.toFixed(1)} kg</span>
        <span>Max: {max.toFixed(1)} kg</span>
      </div>
    </motion.div>
  );
}
