import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyOtpAction } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

type VerifyPageProps = {
  searchParams: Promise<{ email?: string; error?: string; devOtp?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const session = await getSession();
  if (session) redirect(session.isAdmin ? "/admin" : "/jugar");

  const params = await searchParams;
  if (!params.email) redirect("/login");

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Verificación</p>
        <h1>Revisa tu correo</h1>
        <p className="muted">Enviamos un código a <strong>{params.email}</strong>.</p>

        {params.devOtp && <div className="alert success">DEV OTP: {params.devOtp}</div>}
        {params.error && <div className="alert">Código inválido o vencido. Intenta de nuevo.</div>}

        <form action={verifyOtpAction} className="stack">
          <input type="hidden" name="email" value={params.email} />
          <label>
            Código OTP
            <input name="otp" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="123456" required />
          </label>
          <button className="primary-button" type="submit">Entrar</button>
        </form>

        <Link className="text-link" href={`/login?email=${encodeURIComponent(params.email)}`}>Solicitar otro código</Link>
      </section>
    </main>
  );
}
