import { WeekGrid } from "@/components/core/WeekGrid";
import { WorkoutLog } from "@/components/core/WorkoutLog";

export default function WorkoutsPage() {
  return (
    <div className="space-y-4">
      <WorkoutLog />
      <WeekGrid />
    </div>
  );
}
