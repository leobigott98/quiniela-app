import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { saveResult } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/format";
import { BottomNav } from "@/app/jugar/_components/BottomNav";

type AdminGame = {
  id: string;
  match_time: Date;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
};

type UserExport = { name: string; phone_number: string; created_at: Date };

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/login");

  const games = await query<AdminGame>(
    `SELECT BIN_TO_UUID(g.id) id, g.match_time, ht.name home_team, at.name away_team, g.home_score, g.away_score
     FROM games g
     JOIN teams ht ON ht.id = g.home_team_id
     JOIN teams at ON at.id = g.away_team_id
     ORDER BY g.match_time ASC`
  );

  const users = await query<UserExport>(
    `SELECT name, phone_number, created_at FROM users WHERE is_admin = FALSE ORDER BY created_at DESC LIMIT 200`
  );

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Panel interno</div>
        <h1>Admin</h1>
        <p>Carga resultados y revisa usuarios registrados.</p>
      </section>

      <section className="stack">
        <h2>Resultados</h2>
        {games.map((game) => (
          <form action={saveResult} className="card stack" key={game.id}>
            <input type="hidden" name="gameId" value={game.id} />
            <div>
              <strong>{game.home_team} vs {game.away_team}</strong>
              <div className="small">{formatDateTime(game.match_time)}</div>
            </div>
            <div className="score-grid">
              <span className="team">{game.home_team}</span>
              <input className="input" name="homeScore" type="number" min="0" defaultValue={game.home_score ?? ""} required />
              <span className="vs">-</span>
              <input className="input" name="awayScore" type="number" min="0" defaultValue={game.away_score ?? ""} required />
              <span className="team" style={{ textAlign: "right" }}>{game.away_team}</span>
            </div>
            <button className="btn secondary">Guardar resultado y recalcular</button>
          </form>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Usuarios CRM</h2>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Teléfono</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.phone_number}><td>{u.name}</td><td>{u.phone_number}</td></tr>)}</tbody>
        </table>
        <p className="small">MVP: copia esta tabla. Luego puedes agregar exportación CSV.</p>
      </section>

      <BottomNav active="admin" />
    </main>
  );
}
