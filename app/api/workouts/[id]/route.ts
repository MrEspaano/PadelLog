import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { MatchStatus, UnforcedErrorsLevel, WorkoutType } from "@/lib/types";

interface RouteContext {
  params: {
    id: string;
  };
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function parseWorkoutType(value: unknown): WorkoutType {
  if (value === "padel" || value === "running" || value === "strength" || value === "other") {
    return value;
  }
  return "other";
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
    message.includes("match_status") ||
    message.includes("unforced_errors_level") ||
    message.includes("coach_summary") ||
    message.includes("coach_tags")
  );
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workoutId = context.params.id;
  if (!workoutId) {
    return NextResponse.json({ error: "Workout-id saknas." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const workout = typeof body?.workout === "object" && body.workout !== null ? body.workout : {};
  const padel = typeof body?.padel === "object" && body.padel !== null ? body.padel : null;

  const date = String((workout as { date?: unknown }).date ?? "");
  const durationMin = Number((workout as { duration_min?: unknown }).duration_min ?? 0);
  const type = parseWorkoutType((workout as { type?: unknown }).type);

  if (!date || !Number.isFinite(durationMin) || durationMin <= 0) {
    return NextResponse.json({ error: "Datum och duration > 0 krävs." }, { status: 400 });
  }

  try {
    const result = await sql.begin(async (t: typeof sql) => {
      const updatedWorkoutRows = await t`
        update workouts
        set
          date = ${date},
          type = ${type},
          duration_min = ${durationMin},
          intensity_1_5 = ${parseNumber((workout as { intensity_1_5?: unknown }).intensity_1_5)},
          feeling_1_5 = ${parseNumber((workout as { feeling_1_5?: unknown }).feeling_1_5)},
          note = ${((workout as { note?: unknown }).note ? String((workout as { note?: unknown }).note) : null)}
        where id = ${workoutId}
          and user_id = ${session.user.id}
        returning *
      `;

      if (updatedWorkoutRows.length === 0) {
        return null;
      }

      const updatedWorkout = updatedWorkoutRows[0];
      let updatedPadelSession: Record<string, unknown> | null = null;

      if (type === "padel") {
        const existingPadel = await t`
          select id
          from padel_sessions
          where workout_id = ${workoutId}
          limit 1
        `;

        if (existingPadel.length > 0) {
          try {
            const updatedPadelRows = await t`
              update padel_sessions
              set
                session_format = ${(padel as { session_format?: unknown })?.session_format ? String((padel as { session_format?: unknown }).session_format) : null},
                partner = ${(padel as { partner?: unknown })?.partner ? String((padel as { partner?: unknown }).partner) : null},
                opponents = ${(padel as { opponents?: unknown })?.opponents ? String((padel as { opponents?: unknown }).opponents) : null},
                results = ${(padel as { results?: unknown })?.results ? String((padel as { results?: unknown }).results) : null},
                match_status = ${parseMatchStatus((padel as { match_status?: unknown })?.match_status)},
                unforced_errors_level = ${parseUnforcedErrorsLevel((padel as { unforced_errors_level?: unknown })?.unforced_errors_level)},
                tags = ${Array.isArray((padel as { tags?: unknown[] })?.tags) ? (padel as { tags?: unknown[] }).tags : []},
                ball_share = ${parseNumber((padel as { ball_share?: unknown })?.ball_share)}
              where workout_id = ${workoutId}
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
            updatedPadelSession = updatedPadelRows[0] ?? null;
          } catch (error) {
            if (!isSchemaDriftError(error)) {
              throw error;
            }

            const updatedPadelRows = await t`
              update padel_sessions
              set
                session_format = ${(padel as { session_format?: unknown })?.session_format ? String((padel as { session_format?: unknown }).session_format) : null},
                partner = ${(padel as { partner?: unknown })?.partner ? String((padel as { partner?: unknown }).partner) : null},
                opponents = ${(padel as { opponents?: unknown })?.opponents ? String((padel as { opponents?: unknown }).opponents) : null},
                results = ${(padel as { results?: unknown })?.results ? String((padel as { results?: unknown }).results) : null},
                tags = ${Array.isArray((padel as { tags?: unknown[] })?.tags) ? (padel as { tags?: unknown[] }).tags : []},
                ball_share = ${parseNumber((padel as { ball_share?: unknown })?.ball_share)}
              where workout_id = ${workoutId}
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
            updatedPadelSession = updatedPadelRows[0] ?? null;
          }
        } else {
          const createdPadelRows = await t`
            insert into padel_sessions (workout_id, session_format, partner, opponents, results, tags, ball_share)
            values (
              ${workoutId},
              ${(padel as { session_format?: unknown })?.session_format ? String((padel as { session_format?: unknown }).session_format) : null},
              ${(padel as { partner?: unknown })?.partner ? String((padel as { partner?: unknown }).partner) : null},
              ${(padel as { opponents?: unknown })?.opponents ? String((padel as { opponents?: unknown }).opponents) : null},
              ${(padel as { results?: unknown })?.results ? String((padel as { results?: unknown }).results) : null},
              ${Array.isArray((padel as { tags?: unknown[] })?.tags) ? (padel as { tags?: unknown[] }).tags : []},
              ${parseNumber((padel as { ball_share?: unknown })?.ball_share)}
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
          updatedPadelSession = createdPadelRows[0] ?? null;
        }
      }

      const painRows = await t`
        select id, user_id, workout_id, pain_area, pain_intensity_0_10, pain_type, pain_note, created_at
        from pain_logs
        where workout_id = ${workoutId}
        order by created_at desc
      `.catch(() => []);

      return {
        ...updatedWorkout,
        padel_session: type === "padel" ? updatedPadelSession : null,
        pain_logs: painRows
      };
    });

    if (!result) {
      return NextResponse.json({ error: "Passet hittades inte eller tillhör inte användaren." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/workouts/[id] failed:", error);
    return NextResponse.json({ error: "Kunde inte uppdatera passet just nu." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workoutId = context.params.id;

  if (!workoutId) {
    return NextResponse.json({ error: "Workout-id saknas." }, { status: 400 });
  }

  const deleted = await sql`
    delete from workouts
    where id = ${workoutId}
      and user_id = ${session.user.id}
    returning id
  `;

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Passet hittades inte eller tillhör inte användaren." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: workoutId });
}
