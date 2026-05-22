"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { clearSession, setSession } from "@/lib/session";
import { generateOtp, normalizeEmail, storeOtp, verifyOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { RowDataPacket } from "mysql2";

const pool = getPool();

function cleanPhone(phone: string) {
  return phone.replace(/[^+0-9]/g, "").trim() || null;
}

export async function requestOtpAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim();
  const phone = cleanPhone(String(formData.get("phone_number") || ""));
  const championTeamId = String(formData.get("champion_team_id") || "").trim();

  if (!email || !email.includes("@")) {
    redirect("/login?error=invalid_email");
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT BIN_TO_UUID(id) AS id, is_admin FROM users WHERE email = :email LIMIT 1`,
    { email }
  );

  if (existing.length === 0) {
    if (!name || !phone) {
      redirect(`/login?email=${encodeURIComponent(email)}&error=missing_profile`);
    }

    await pool.execute(
      `INSERT INTO users (name, email, phone_number, is_admin)
       VALUES (:name, :email, :phone, FALSE)`,
      { name, email, phone }
    );

    if (championTeamId) {
      await pool.execute(
        `INSERT INTO tournament_winner_predictions (user_id, team_id)
         SELECT id, UUID_TO_BIN(:teamId) FROM users WHERE email = :email`,
        { teamId: championTeamId, email }
      );
    }
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  await sendOtpEmail(email, otp);

  if (process.env.DEV_SHOW_OTP === "true") {
    redirect(`/login/verify?email=${encodeURIComponent(email)}&devOtp=${otp}`);
  }

  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyOtpAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const otp = String(formData.get("otp") || "").trim();

  if (!email || !otp) {
    redirect(`/login/verify?email=${encodeURIComponent(email)}&error=missing_otp`);
  }

  const isValid = await verifyOtp(email, otp);
  if (!isValid) {
    redirect(`/login/verify?email=${encodeURIComponent(email)}&error=invalid_otp`);
  }

  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT BIN_TO_UUID(id) AS id, email, name, is_admin FROM users WHERE email = :email LIMIT 1`,
    { email }
  );

  const user = users[0];
  if (!user) {
    redirect("/login?error=user_not_found");
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: Boolean(user.is_admin),
  });

  redirect(Boolean(user.is_admin) ? "/admin" : "/jugar");
}

export async function signOutAction() {
  await clearSession();
  redirect("/login");
}
