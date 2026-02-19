import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { PainArea, PainType } from "@/lib/types";

const PAIN_AREAS: PainArea[] = ["nacke", "rygg", "axel", "armbåge", "handled", "höft", "knä", "vad", "fot", "annan"];
const PAIN_TYPES: PainType[] = ["stelhet", "skarp", "molande", "domning", "annat"];

interface RouteContext {
  params: {
    id: string;
  };
}

function parsePainArea(value: unknown): PainArea {
  if (typeof value === "string" && PAIN_AREAS.includes(value as PainArea)) {
    return value as PainArea;
  }
  return "annan";
}

function parsePainType(value: unknown): PainType | null {
  if (typeof value === "string" && PAIN_TYPES.includes(value as PainType)) {
    return value as PainType;
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workoutId = context.params.id;
  const body = await request.json();

  const intensity = Number(body.pain_intensity_0_10 ?? -1);
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 10) {
    return NextResponse.json({ error: "Smärtintensitet måste vara 0-10." }, { status: 400 });
  }

  const ownership = await sql`
    select id
    from workouts
    where id = ${workoutId}
      and user_id = ${session.user.id}
    limit 1
  `;

  if (ownership.length === 0) {
    return NextResponse.json({ error: "Passet hittades inte." }, { status: 404 });
  }

  const inserted = await sql`
    insert into pain_logs (
      user_id,
      workout_id,
      pain_area,
      pain_intensity_0_10,
      pain_type,
      pain_note
    )
    values (
      ${session.user.id},
      ${workoutId},
      ${parsePainArea(body.pain_area)},
      ${Math.round(intensity)},
      ${parsePainType(body.pain_type)},
      ${typeof body.pain_note === "string" ? body.pain_note : null}
    )
    returning id, user_id, workout_id, pain_area, pain_intensity_0_10, pain_type, pain_note, created_at
  `;

  return NextResponse.json(inserted[0], { status: 201 });
}
