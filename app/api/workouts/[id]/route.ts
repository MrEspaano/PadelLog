import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

interface RouteContext {
  params: {
    id: string;
  };
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
