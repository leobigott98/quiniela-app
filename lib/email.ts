import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, otp: string) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.log(`[DEV OTP] ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Tu código de acceso a la Quiniela",
    text: `Tu código de acceso es ${otp}. Vence en ${process.env.OTP_EXPIRATION_MINUTES ?? 10} minutos.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Tu código de acceso</h2>
        <p>Usa este código para entrar a la Quiniela:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0">${otp}</div>
        <p>Este código vence en ${process.env.OTP_EXPIRATION_MINUTES ?? 10} minutos.</p>
      </div>
    `,
  });
}
