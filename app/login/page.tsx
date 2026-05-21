import { loginOrRegister, adminLogin } from "@/app/actions/auth";
import { query } from "@/lib/db";

type TeamRow = { id: string; name: string };

export default async function LoginPage() {
  const teams = await query<TeamRow>(`SELECT BIN_TO_UUID(id) id, name FROM teams ORDER BY name`);

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Quiniela Aniversario</div>
        <h1>Entra, pronostica y compite.</h1>
        <p>Registro rápido con nombre y teléfono. Sin contraseñas complicadas.</p>
      </section>

      <form action={loginOrRegister} className="card stack">
        <div>
          <label className="label">Nombre completo</label>
          <input className="input" name="name" placeholder="Ej. Leonardo Bigott" />
          <p className="small">Si ya te registraste, puedes dejarlo vacío y entrar con tu teléfono.</p>
        </div>
        <div>
          <label className="label">Número de contacto</label>
          <input className="input" name="phoneNumber" inputMode="tel" placeholder="Ej. 04121234567" required />
        </div>
        <div>
          <label className="label">Campeón del torneo</label>
          <select className="select" name="championTeamId" defaultValue="">
            <option value="">Elegir al registrarme</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <p className="small">Esta predicción solo se guarda al crear tu usuario.</p>
        </div>
        <button className="btn">Entrar</button>
      </form>

      <details style={{ marginTop: 18 }}>
        <summary className="small">Acceso administrador</summary>
        <form action={adminLogin} className="card stack" style={{ marginTop: 12 }}>
          <input className="input" name="pin" type="password" placeholder="PIN admin" />
          <button className="btn secondary">Entrar al admin</button>
        </form>
      </details>
    </main>
  );
}
