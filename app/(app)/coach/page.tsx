import { CriticalCoachPanel } from "@/components/core/CriticalCoachPanel";
import { PainStatsPanel } from "@/components/core/PainStatsPanel";
import { WinRatePanel } from "@/components/core/WinRatePanel";

export default function CoachPage() {
  return (
    <div className="space-y-4">
      <WinRatePanel />
      <PainStatsPanel />
      <CriticalCoachPanel />
    </div>
  );
}
