import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

function periodCondition(days: number | null) {
  if (!days || days <= 0) {
    return sql`true`;
  }

  return sql`w.date >= current_date - ${days}::int`;
}

function calcRate(wins: number, losses: number) {
  const total = wins + losses;
  if (total === 0) {
    return null;
  }
  return Number(((wins / total) * 100).toFixed(1));
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodDaysParam = searchParams.get("days");
  const days = periodDaysParam && periodDaysParam !== "all" ? Number(periodDaysParam) : null;
  const periodSql = periodCondition(Number.isFinite(days ?? NaN) ? days : null);

  const totals = await sql`
    select
      count(*) filter (where ps.match_status = 'win')::int as wins,
      count(*) filter (where ps.match_status = 'loss')::int as losses,
      count(*) filter (where ps.match_status in ('unclear', 'aborted') or ps.match_status is null)::int as unclear
    from workouts w
    join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.type = 'padel'
      and ${periodSql}
  `;

  const totalRow = totals[0] ?? { wins: 0, losses: 0, unclear: 0 };
  const totalWinRate = calcRate(totalRow.wins, totalRow.losses);

  const partners = await sql`
    select
      coalesce(nullif(trim(ps.partner), ''), 'Okänd partner') as partner,
      count(*) filter (where ps.match_status = 'win')::int as wins,
      count(*) filter (where ps.match_status = 'loss')::int as losses,
      count(*)::int as matches
    from workouts w
    join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.type = 'padel'
      and ${periodSql}
      and ps.match_status in ('win', 'loss')
    group by coalesce(nullif(trim(ps.partner), ''), 'Okänd partner')
    having count(*) >= 3
  `;

  const partnerWinRate = partners
    .map((row) => ({
      partner: row.partner,
      wins: row.wins,
      losses: row.losses,
      matches: row.matches,
      winRate: calcRate(row.wins, row.losses)
    }))
    .filter((row) => row.winRate !== null)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
    .slice(0, 3);

  const opponents = await sql`
    select
      coalesce(nullif(trim(ps.opponents), ''), 'Okänt motstånd') as opponents,
      count(*) filter (where ps.match_status = 'win')::int as wins,
      count(*) filter (where ps.match_status = 'loss')::int as losses,
      count(*)::int as matches
    from workouts w
    join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.type = 'padel'
      and ${periodSql}
      and ps.match_status in ('win', 'loss')
      and nullif(trim(ps.opponents), '') is not null
    group by coalesce(nullif(trim(ps.opponents), ''), 'Okänt motstånd')
    having count(*) >= 1
  `;

  const opponentWinRate = opponents
    .map((row) => ({
      opponents: row.opponents,
      wins: row.wins,
      losses: row.losses,
      matches: row.matches,
      winRate: calcRate(row.wins, row.losses)
    }))
    .filter((row) => row.winRate !== null)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));

  const recentMatches = await sql`
    select
      w.id,
      w.date::text as date,
      ps.partner,
      ps.opponents,
      ps.results,
      coalesce(ps.match_status, 'unclear') as match_status
    from workouts w
    join padel_sessions ps on ps.workout_id = w.id
    where w.user_id = ${session.user.id}
      and w.type = 'padel'
      and ${periodSql}
    order by w.date desc, w.created_at desc
    limit 10
  `;

  return NextResponse.json({
    periodDays: days,
    total: {
      wins: totalRow.wins,
      losses: totalRow.losses,
      unclear: totalRow.unclear,
      winRate: totalWinRate
    },
    partnerWinRate,
    opponentWinRate,
    recentMatches
  });
}
