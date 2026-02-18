import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email och lösenord krävs." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Lösenord måste vara minst 8 tecken." }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await sql`
      insert into app_users (email, password_hash)
      values (${email}, ${passwordHash})
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "E-postadressen används redan." }, { status: 409 });
    }

    return NextResponse.json({ error: "Kunde inte skapa konto." }, { status: 500 });
  }
}
