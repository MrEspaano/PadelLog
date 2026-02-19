import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateCoachSummary } from "@/lib/coach/engine";
import { sql } from "@/lib/db";
import type { MatchStatus, PainLogInsert, UnforcedErrorsLevel } from "@/lib/types";

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

function parseMatchStatus(value: unknown): MatchStatus | null {
  if (value !== "win" && value !== "loss" && value !== "unclear" && value !== "aborted") {
    return null;
  }
  return value;
}

function normalizePainLogs(value: unknown): PainLogInsert[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((log) => ({
      pain_area: typeof log?.pain_area === "string" ? log.pain_area : "annan",
      pain_intensity_0_10: Number(log?.pain_intensity_0_10 ?? 0),
      pain_type: typeof log?.pain_type === "string" ? log.pain_type : null,
      pain_note: typeof log?.pain_note === "string" ? log.pain_note : null
    }))
    .filter((log) => Number.isFinite(log.pain_intensity_0_10) && log.pain_intensity_0_10 >= 0 && log.pain_intensity_0_10 <= 10);
}

function isMissingPainLogsTable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("relation") && message.includes("pain_logs") && message.includes("does not exist");
}

function isSchemaDriftError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const maybeCode = (error as { code?: string }).code;
  if (maybeCode === "42P01" || maybeCode === "42703") {
    return true;
  }

  return (
    (message.includes("does not exist") && message.includes("relation")) ||
    (message.includes("does not exist") && message.includes("column")) ||
    message.includes("pain_logs") ||
    message.includes("match_status") ||
    message.includes("unforced_errors_level") ||
    message.includes("coach_summary") ||
    message.includes("coach_tags")
  );
}

async function safeInsertPainLogs(
  t: typeof sql,
  userId: string,
  workoutId: string,
  painLogs: PainLogInsert[]
) {
  if (painLogs.length === 0) {
    return;
  }

  try {
    for (const painLog of painLogs.slice(0, 2)) {
      const painType = painLog.pain_type ?? null;
      const painNote = painLog.pain_note ?? null;
      await t`
        insert into pain_logs (
          user_id,
          workout_id,
          pain_area,
          pain_intensity_0_10,
          pain_type,
          pain_note
        )
        values (
          ${userId},
          ${workoutId},
          ${painLog.pain_area},
          ${painLog.pain_intensity_0_10},
          ${painType},
          ${painNote}
        )
      `;
    }
  } catch (error) {
    if (!isMissingPainLogsTable(error)) {
      throw error;
    }
  }
}

async function safeFetchPainRows(t: typeof sql, workoutId: string) {
  try {
    return await t`
      select id, user_id, workout_id, pain_area, pain_intensity_0_10, pain_type, pain_note, created_at
      from pain_logs
      where workout_id = ${workoutId}
      order by created_at desc
    `;
  } catch (error) {
    if (isMissingPainLogsTable(error)) {
      return [];
    }
    throw error;
  }
}

async function safeInsertPadelSession(
  t: typeof sql,
  workoutId: string,
  padel: Record<string, unknown> | null,
  coach: { summary: string; tags: string[] }
) {
  try {
    const padelRows = await t`
      insert into padel_sessions (
        workout_id,
        session_format,
        partner,
        opponents,
        results,
        match_status,
        unforced_errors_level,
        coach_summary,
        coach_tags,
        tags,
        ball_share
      )
      values (
        ${workoutId},
        ${padel?.session_format ? String(padel.session_format) : null},
        ${padel?.partner ? String(padel.partner) : null},
        ${padel?.opponents ? String(padel.opponents) : null},
        ${padel?.results ? String(padel.results) : null},
        ${parseMatchStatus(padel?.match_status)},
        ${parseUnforcedErrorsLevel(padel?.unforced_errors_level)},
        ${coach.summary},
        ${coach.tags},
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
        match_status,
        unforced_errors_level,
        coach_summary,
        coach_tags,
        tags,
        ball_share,
        created_at
    `;

    return padelRows[0];
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }

    try {
      // Fallback for environments where latest padel_sessions columns are not yet migrated.
      const legacyPadelRows = await t`
        insert into padel_sessions (
          workout_id,
          session_format,
          partner,
          opponents,
          results,
          tags,
          ball_share
        )
        values (
          ${workoutId},
          ${padel?.session_format ? String(padel.session_format) : null},
          ${padel?.partner ? String(padel.partner) : null},
          ${padel?.opponents ? String(padel.opponents) : null},
          ${padel?.results ? String(padel.results) : null},
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
          null::text as match_status,
          null::text as unforced_errors_level,
          null::text as coach_summary,
          '{}'::text[] as coach_tags,
          coalesce(tags, '{}'::text[]) as tags,
          ball_share,
          created_at
      `;

      return legacyPadelRows[0];
    } catch (legacyError) {
      if (!isSchemaDriftError(legacyError)) {
        throw legacyError;
      }

      // Minimal fallback for very old schemas.
      const minimalPadelRows = await t`
        insert into padel_sessions (
          workout_id,
          session_format,
          partner,
          opponents,
          results
        )
        values (
          ${workoutId},
          ${padel?.session_format ? String(padel.session_format) : null},
          ${padel?.partner ? String(padel.partner) : null},
          ${padel?.opponents ? String(padel.opponents) : null},
          ${padel?.results ? String(padel.results) : null}
        )
        returning
          id,
          workout_id,
          session_format,
          partner,
          opponents,
          results,
          null::text as match_status,
          null::text as unforced_errors_level,
          null::text as coach_summary,
          '{}'::text[] as coach_tags,
          '{}'::text[] as tags,
          null::numeric as ball_share,
          created_at
      `;

      return minimalPadelRows[0];
    }
  }
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

  let rows: readonly unknown[] = [];
  try {
    rows = await sql`
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
        row_to_json(ps) as padel_session,
        coalesce((
          select json_agg(pl order by pl.created_at desc)
          from pain_logs pl
          where pl.workout_id = w.id
        ), '[]'::json) as pain_logs
      from workouts w
      left join padel_sessions ps on ps.workout_id = w.id
      where w.user_id = ${session.user.id}
        and (${startDate}::date is null or w.date >= ${startDate}::date)
        and (${endDate}::date is null or w.date <= ${endDate}::date)
        and (${type}::text is null or w.type = ${type}::text)
      order by w.date desc, w.created_at desc
      limit ${limit && limit > 0 ? limit : 500}
    `;
  } catch (error) {
    if (!isMissingPainLogsTable(error)) {
      throw error;
    }

    rows = await sql`
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
        row_to_json(ps) as padel_session,
        '[]'::json as pain_logs
      from workouts w
      left join padel_sessions ps on ps.workout_id = w.id
      where w.user_id = ${session.user.id}
        and (${startDate}::date is null or w.date >= ${startDate}::date)
        and (${endDate}::date is null or w.date <= ${endDate}::date)
        and (${type}::text is null or w.type = ${type}::text)
      order by w.date desc, w.created_at desc
      limit ${limit && limit > 0 ? limit : 500}
    `;
  }

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
  const painLogs = normalizePainLogs(body.pain_logs);

  const date = String(workout.date ?? "");
  const type = String(workout.type ?? "");
  const durationMin = Number(workout.duration_min ?? 0);

  if (!date || !type || !durationMin) {
    return NextResponse.json({ error: "Datum, typ och duration krävs." }, { status: 400 });
  }

  try {
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
        await safeInsertPainLogs(t, session.user.id, createdWorkout.id, painLogs);
        const painRows = await safeFetchPainRows(t, createdWorkout.id);

        return {
          ...createdWorkout,
          padel_session: null,
          pain_logs: painRows
        };
      }

      const coach = generateCoachSummary(
        {
          intensity_1_5: parseNumber(workout.intensity_1_5),
          feeling_1_5: parseNumber(workout.feeling_1_5)
        },
        {
          results: padel?.results ? String(padel.results) : null,
          match_status: parseMatchStatus(padel?.match_status),
          tags: Array.isArray(padel?.tags) ? padel.tags : []
        }
      );

      const createdPadelSession = await safeInsertPadelSession(t, createdWorkout.id, padel, coach);

      await safeInsertPainLogs(t, session.user.id, createdWorkout.id, painLogs);
      const painRows = await safeFetchPainRows(t, createdWorkout.id);

      return {
        ...createdWorkout,
        padel_session: createdPadelSession,
        pain_logs: painRows
      };
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isSchemaDriftError(error)) {
      return NextResponse.json(
        { error: "Databasschema saknar nya fält. Kör senaste SQL från neon/schema.sql i Neon och deploya igen." },
        { status: 500 }
      );
    }

    console.error("POST /api/workouts failed:", error);
    return NextResponse.json({ error: "Kunde inte spara pass just nu." }, { status: 500 });
  }
}
