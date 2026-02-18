"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import * as XLSX from "xlsx";
import { getISOWeek } from "date-fns";

import { Button } from "@/components/ui/button";
import type { WorkoutWithPadel } from "@/lib/types";
import { filenameDateRange, parseISODate, toISODate } from "@/lib/utils/date";

interface ExcelExportButtonProps {
  workouts: WorkoutWithPadel[];
  startDate: string;
  endDate: string;
}

function rangeDays(startDate: string, endDate: string) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  const days: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function ExcelExportButton({ workouts, startDate, endDate }: ExcelExportButtonProps) {
  const hasData = workouts.length > 0;

  const weekRows = useMemo(() => {
    const byDate = new Map<string, WorkoutWithPadel[]>();
    workouts.forEach((workout) => {
      const current = byDate.get(workout.date) ?? [];
      current.push(workout);
      byDate.set(workout.date, current);
    });

    return rangeDays(startDate, endDate).map((date) => {
      const isoDate = toISODate(date);
      const dayWorkouts = byDate.get(isoDate) ?? [];

      return {
        datum: isoDate,
        veckodag: date.toLocaleDateString("sv-SE", { weekday: "long" }),
        iso_vecka: getISOWeek(date),
        antal_pass: dayWorkouts.length,
        pass_typer: dayWorkouts.map((workout) => workout.type).join(", ") || "Vila",
        total_tid_min: dayWorkouts.reduce((sum, workout) => sum + workout.duration_min, 0),
        vila: dayWorkouts.length === 0 ? "Ja" : "Nej"
      };
    });
  }, [endDate, startDate, workouts]);

  function exportExcel() {
    if (!hasData) {
      return;
    }

    const workbook = XLSX.utils.book_new();

    const workoutRows = workouts.map((workout) => ({
      datum: workout.date,
      typ: workout.type,
      duration_min: workout.duration_min,
      intensity: workout.intensity_1_5 ?? "",
      feeling: workout.feeling_1_5 ?? "",
      partner: workout.padel_session?.partner ?? "",
      opponents: workout.padel_session?.opponents ?? "",
      results: workout.padel_session?.results ?? "",
      unforced_errors: workout.padel_session?.unforced_errors_level ?? "",
      tags: workout.padel_session?.tags?.join(", ") ?? "",
      kommentar: workout.note ?? ""
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(workoutRows), "Passlogg");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(weekRows), "Veckorutnät");

    const fileName = `padelfocus_${filenameDateRange(startDate, endDate)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  return (
    <Button onClick={exportExcel} disabled={!hasData} variant="secondary">
      <Download className="mr-2 h-4 w-4" />
      Exportera Excel
    </Button>
  );
}
