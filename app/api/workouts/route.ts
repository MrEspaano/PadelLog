import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { UnforcedErrorsLevel } from "@/lib/types";

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function parseUnforcedErrorsLevel(value: unknown): UnforcedErrorsLevel | null {
  if (value !== "low" && value !== "medium" && value !== "high") {
    return null;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const type = searchParams.get("type");
  const limit = parseNumber(searchParams.get("limit"));

  const rows = await sql`
    select
      w.id,
      w.user_id,
      w.date::text as date,
      w.type,
      w.duration_min,
      w.intensity_1_5,
      w.feeling_1_5,
      w.note,
      w.created_at,
      row_to_json(ps) as padel_session
    from workouts w
    left join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and (${startDate}::date is null or w.date >= ${startDate}::date)
      and (${endDate}::date is null or w.date <= ${endDate}::date)
      and (${type}::text is null or w.type = ${type}::text)
    order by w.date desc, w.created_at desc
    limit ${limit && limit > 0 ? limit : 500}
  `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const workout = body.workout ?? {};
  const padel = body.padel ?? null;

  const date = String(workout.date ?? "");
  const type = String(workout.type ?? "");
  const durationMin = Number(workout.duration_min ?? 0);

  if (!date || !type || !durationMin) {
    return NextResponse.json({ error: "Datum, typ och duration krävs." }, { status: 400 });
  }

  const created = await sql.begin(async (tx: unknown) => {
    const t = tx as unknown as typeof sql;

    const workoutRows = await t`
      insert into workouts (user_id, date, type, duration_min, intensity_1_5, feeling_1_5, note)
      values (
        ${session.user.id},
        ${date},
        ${type},
        ${durationMin},
        ${parseNumber(workout.intensity_1_5)},
        ${parseNumber(workout.feeling_1_5)},
        ${workout.note ? String(workout.note) : null}
      )
      returning id, user_id, date::text as date, type, duration_min, intensity_1_5, feeling_1_5, note, created_at
    `;

    const createdWorkout = workoutRows[0];

    if (type !== "padel") {
      return {
        ...createdWorkout,
        padel_session: null
      };
    }

    const padelRows = await t`
      insert into padel_sessions (
        workout_id,
        session_format,
        partner,
        opponents,
        results,
        unforced_errors_level,
        tags,
        ball_share
      )
      values (
        ${createdWorkout.id},
        ${padel?.session_format ? String(padel.session_format) : null},
        ${padel?.partner ? String(padel.partner) : null},
        ${padel?.opponents ? String(padel.opponents) : null},
        ${padel?.results ? String(padel.results) : null},
        ${parseUnforcedErrorsLevel(padel?.unforced_errors_level)},
        ${Array.isArray(padel?.tags) ? padel.tags : []},
        ${parseNumber(padel?.ball_share)}
      )
      returning
        id,
        workout_id,
        session_format,
        partner,
        opponents,
        results,
        unforced_errors_level,
        tags,
        ball_share,
        created_at
    `;

    return {
      ...createdWorkout,
      padel_session: padelRows[0]
    };
  });

  return NextResponse.json(created, { status: 201 });
}
