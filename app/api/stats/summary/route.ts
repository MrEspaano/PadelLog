import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

function roundOne(value: number) {
  return Number(value.toFixed(1));
}

function daysBetweenInclusive(start: Date, end: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
}

function monthsBetweenInclusive(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function yearsBetweenInclusive(start: Date, end: Date) {
  return end.getFullYear() - start.getFullYear() + 1;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workoutsTotalRows = await sql`
    select
      count(*)::int as total_workouts,
      min(date)::text as first_date,
      max(date)::text as last_date
    from workouts
    where user_id = ${session.user.id}
  `;

  const matchTotalsRows = await sql`
    select
      count(*) filter (where ps.match_status = 'win')::int as wins,
      count(*) filter (where ps.match_status = 'loss')::int as losses
    from workouts w
    join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.type = 'padel'
  `;

  const workoutTotals = workoutsTotalRows[0] ?? { total_workouts: 0, first_date: null, last_date: null };
  const matchTotals = matchTotalsRows[0] ?? { wins: 0, losses: 0 };

  const totalWorkouts = workoutTotals.total_workouts ?? 0;
  const firstDate = workoutTotals.first_date ? new Date(workoutTotals.first_date) : null;
  const lastDate = workoutTotals.last_date ? new Date(workoutTotals.last_date) : null;

  const weekSpan = firstDate && lastDate ? Math.max(1, Math.ceil(daysBetweenInclusive(firstDate, lastDate) / 7)) : 1;
  const monthSpan = firstDate && lastDate ? Math.max(1, monthsBetweenInclusive(firstDate, lastDate)) : 1;
  const yearSpan = firstDate && lastDate ? Math.max(1, yearsBetweenInclusive(firstDate, lastDate)) : 1;

  return NextResponse.json({
    averages: {
      perWeek: roundOne(totalWorkouts / weekSpan),
      perMonth: roundOne(totalWorkouts / monthSpan),
      perYear: roundOne(totalWorkouts / yearSpan)
    },
    totals: {
      workouts: totalWorkouts,
      wins: matchTotals.wins ?? 0,
      losses: matchTotals.losses ?? 0
    },
    period: {
      firstDate: workoutTotals.first_date,
      lastDate: workoutTotals.last_date
    }
  });
}
