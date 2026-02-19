import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekly = await sql`
    select
      to_char(date_trunc('week', w.date::timestamp), 'IYYY-"W"IW') as iso_week,
      count(pl.id)::int as pain_logs,
      coalesce(avg(pl.pain_intensity_0_10), 0)::numeric(4,1) as avg_intensity
    from workouts w
    left join pain_logs pl on pl.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.date >= current_date - interval '90 days'
    group by date_trunc('week', w.date::timestamp)
    order by date_trunc('week', w.date::timestamp) desc
    limit 12
  `;

  const topAreas = await sql`
    select
      pain_area,
      count(*)::int as count
    from pain_logs
    where user_id = ${session.user.id}
    group by pain_area
    order by count(*) desc
    limit 5
  `;

  return NextResponse.json({
    weekly,
    topAreas
  });
}
