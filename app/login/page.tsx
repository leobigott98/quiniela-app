import { redirect } from "next/navigation";
import { requestOtpAction } from "@/app/actions/auth";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; email?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid_email: "Ingresa un correo válido.",
  missing_profile: "Si es tu primera vez, necesitamos tu nombre y teléfono.",
  user_not_found: "No encontramos ese usuario.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) redirect(session.isAdmin ? "/admin" : "/jugar");

  const params = await searchParams;
  const teams = await query<{ id: string; name: string }>(
    `SELECT BIN_TO_UUID(id) AS id, name FROM teams ORDER BY name ASC`
  );

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Quiniela Aniversario</p>
        <h1>Entra con tu correo</h1>
        <p className="muted">
          Te enviaremos un código de 6 dígitos. Sin contraseña, sin WhatsApp, sin complicaciones.
        </p>

        {params.error && <div className="alert">{errorMessages[params.error] ?? "No se pudo procesar la solicitud."}</div>}

        <form action={requestOtpAction} className="stack">
          <label>
            Correo electrónico
            <input name="email" type="email" defaultValue={params.email ?? ""} placeholder="tu@correo.com" required />
          </label>

          <div className="divider">Si es tu primera vez, completa estos datos</div>

          <label>
            Nombre completo
            <input name="name" placeholder="Ej. Leonardo Bigott" />
          </label>

          <label>
            Teléfono
            <input name="phone_number" inputMode="tel" placeholder="Ej. 04141234567" />
          </label>

          <label>
            Campeón del torneo <span className="soft">opcional al registrarte</span>
            <select name="champion_team_id" defaultValue="">
              <option value="">Seleccionar después</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </label>

          <button className="primary-button" type="submit">Enviar código</button>
        </form>
      </section>
    </main>
  );
}