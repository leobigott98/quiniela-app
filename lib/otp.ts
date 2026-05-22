import crypto from "node:crypto";
import { getPool } from "./db";
import { RowDataPacket } from "mysql2";

const pool = getPool();

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${otp}:${process.env.SESSION_SECRET}`)
    .digest("hex");
}

export async function storeOtp(email: string, otp: string) {
  const normalized = normalizeEmail(email);
  const minutes = Number(process.env.OTP_EXPIRATION_MINUTES ?? 10);

  await pool.execute(
    `UPDATE email_otps
     SET consumed_at = UTC_TIMESTAMP()
     WHERE email = :email AND consumed_at IS NULL`,
    { email: normalized }
  );

  await pool.execute(
    `INSERT INTO email_otps (email, otp_hash, expires_at)
     VALUES (:email, :hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :minutes MINUTE))`,
    { email: normalized, hash: hashOtp(normalized, otp), minutes }
  );
}

export async function verifyOtp(email: string, otp: string) {
  const normalized = normalizeEmail(email);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, otp_hash, attempts
     FROM email_otps
     WHERE email = :email
       AND consumed_at IS NULL
       AND expires_at > UTC_TIMESTAMP()
     ORDER BY created_at DESC
     LIMIT 1`,
    { email: normalized }
  );

  const record = rows[0];
  if (!record) return false;

  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
  if (record.attempts >= maxAttempts) return false;

  const candidate = hashOtp(normalized, otp.trim());
  const matches = crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(record.otp_hash));

  if (!matches) {
    await pool.execute(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = :id`, { id: record.id });
    return false;
  }

  await pool.execute(`UPDATE email_otps SET consumed_at = UTC_TIMESTAMP() WHERE id = :id`, { id: record.id });
  return true;
}
