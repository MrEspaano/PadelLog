import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    select id, user_id, date::text as date, weight_kg, note, created_at
    from weights
    where user_id = ${session.user.id}
    order by date desc, created_at desc
  `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const date = String(body.date ?? "");
  const weightKg = Number(body.weight_kg ?? 0);
  const note = body.note ? String(body.note) : null;

  if (!date || !weightKg) {
    return NextResponse.json({ error: "Datum och vikt krävs." }, { status: 400 });
  }

  const rows = await sql`
    insert into weights (user_id, date, weight_kg, note)
    values (${session.user.id}, ${date}, ${weightKg}, ${note})
    returning id, user_id, date::text as date, weight_kg, note, created_at
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
