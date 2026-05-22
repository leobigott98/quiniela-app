import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { csvEscape } from "@/lib/format";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await query<{
    name: string;
    email: string;
    phone_number: string | null;
    created_at: Date;
  }>(
    `SELECT name, email, phone_number, created_at
     FROM users
     WHERE is_admin = FALSE
     ORDER BY created_at DESC`
  );

  const header = ["name", "email", "phone_number", "created_at"];
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.phone_number ?? "",
    user.created_at?.toISOString?.() ?? String(user.created_at),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("
");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quiniela-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
