"use client";

import { addWeeks, format, getISOWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BallAccentBadge } from "@/components/padel/BallAccentBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWorkoutsInRange } from "@/lib/data/queries";
import type { WorkoutWithPadel } from "@/lib/types";
import { getISOWeekDays, parseISODate, toISODate, weekdayLabel } from "@/lib/utils/date";

function formatTypeLabel(type: WorkoutWithPadel["type"]) {
  if (type === "strength") return "Styrka";
  if (type === "running") return "Löpning";
  if (type === "padel") return "Padel";
  return "Övrigt";
}

export function WeekGrid() {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [workouts, setWorkouts] = useState<WorkoutWithPadel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(() => getISOWeekDays(anchorDate), [anchorDate]);
  const startDate = toISODate(weekDays[0]);
  const endDate = toISODate(weekDays[6]);

  const workoutsByDate = useMemo(() => {
    const grouped = new Map<string, WorkoutWithPadel[]>();
    for (const workout of workouts) {
      const current = grouped.get(workout.date) ?? [];
      current.push(workout);
      grouped.set(workout.date, current);
    }
    return grouped;
  }, [workouts]);

  const selectedWorkouts = workoutsByDate.get(selectedDate) ?? [];

  useEffect(() => {
    if (!weekDays.some((day) => toISODate(day) === selectedDate)) {
      setSelectedDate(startDate);
    }
  }, [selectedDate, startDate, weekDays]);

  useEffect(() => {
    async function loadWeek() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchWorkoutsInRange(startDate, endDate);
        setWorkouts(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunde inte läsa veckopass.");
      } finally {
        setLoading(false);
      }
    }

    void loadWeek();
  }, [endDate, startDate]);

  return (
    <Card className="mat-surface">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Veckorutnät</CardTitle>
            <CardDescription>ISO-vecka {getISOWeek(anchorDate)} · Mån–sön</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setAnchorDate((value) => addWeeks(value, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setAnchorDate((value) => addWeeks(value, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {weekDays.map((day) => {
            const isoDay = toISODate(day);
            const dayWorkouts = workoutsByDate.get(isoDay) ?? [];
            const isSelected = selectedDate === isoDay;

            return (
              <button
                key={isoDay}
                type="button"
                onClick={() => setSelectedDate(isoDay)}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected ? "border-primary bg-primary/10 shadow-soft" : "hover:bg-muted/60"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{weekdayLabel(day)}</p>
                <p className="text-sm font-semibold">{format(day, "d/M")}</p>
                <div className="mt-2 min-h-10 text-xs">
                  {dayWorkouts.length === 0 ? (
                    <span className="text-muted-foreground">Vila</span>
                  ) : (
                    <div className="space-y-1">
                      {dayWorkouts.slice(0, 2).map((workout) => (
                        <div key={workout.id} className="rounded bg-white/85 px-2 py-1">
                          {formatTypeLabel(workout.type)} · {workout.duration_min} min
                        </div>
                      ))}
                      {dayWorkouts.length > 2 ? <div>+{dayWorkouts.length - 2} till</div> : null}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Laddar veckodata...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-padel-line/60 bg-white/75 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">{format(parseISODate(selectedDate), "EEEE d MMMM")}</h4>
              <Badge variant="secondary">{selectedWorkouts.length} pass</Badge>
            </div>

            {selectedWorkouts.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ingen träning loggad denna dag.</p>
                <BallAccentBadge label="Vila" />
              </div>
            ) : (
              <div className="space-y-2">
                {selectedWorkouts.map((workout) => (
                  <div key={workout.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{formatTypeLabel(workout.type)}</Badge>
                      <Badge variant="muted">{workout.duration_min} min</Badge>
                      {workout.intensity_1_5 ? <Badge variant="muted">Int {workout.intensity_1_5}</Badge> : null}
                      {workout.feeling_1_5 ? <Badge variant="muted">Känsla {workout.feeling_1_5}</Badge> : null}
                    </div>
                    {workout.note ? <p className="mt-2 text-sm text-muted-foreground">{workout.note}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
