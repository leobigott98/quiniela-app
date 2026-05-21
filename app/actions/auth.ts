"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { formatPhone } from "@/lib/format";

const loginSchema = z.object({
  name: z.string().trim().min(2).max(250).optional(),
  phoneNumber: z.string().trim().min(7).max(20),
  championTeamId: z.string().uuid().optional().or(z.literal("")),
});

type UserRow = {
  id: string;
  name: string;
  phone_number: string;
  is_admin: 0 | 1;
};

export async function loginOrRegister(formData: FormData) {
  const parsed = loginSchema.parse({
    name: formData.get("name")?.toString(),
    phoneNumber: formData.get("phoneNumber")?.toString(),
    championTeamId: formData.get("championTeamId")?.toString(),
  });

  const phone = formatPhone(parsed.phoneNumber);
  const existing = await query<UserRow>(
    `SELECT BIN_TO_UUID(id) id, name, phone_number, is_admin FROM users WHERE phone_number = :phone LIMIT 1`,
    { phone }
  );

  let user = existing[0];

  if (!user) {
    if (!parsed.name) throw new Error("El nombre es obligatorio para registrarse.");

    await query(
      `INSERT INTO users (name, phone_number) VALUES (:name, :phone)`,
      { name: parsed.name, phone }
    );

    user = (
      await query<UserRow>(
        `SELECT BIN_TO_UUID(id) id, name, phone_number, is_admin FROM users WHERE phone_number = :phone LIMIT 1`,
        { phone }
      )
    )[0];

    if (parsed.championTeamId) {
      await query(
        `INSERT INTO tournament_winner_predictions (user_id, team_id)
         VALUES (UUID_TO_BIN(:userId), UUID_TO_BIN(:teamId))`,
        { userId: user.id, teamId: parsed.championTeamId }
      );
    }
  }

  await createSession({
    id: user.id,
    name: user.name,
    phoneNumber: user.phone_number,
    isAdmin: Boolean(user.is_admin),
  });

  redirect("/jugar");
}

export async function adminLogin(formData: FormData) {
  const pin = formData.get("pin")?.toString();
  if (!pin || pin !== process.env.ADMIN_PIN) throw new Error("PIN inválido.");

  await createSession({
    id: "admin",
    name: "Admin",
    phoneNumber: "admin",
    isAdmin: true,
  });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
