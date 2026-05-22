import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { formatMatchDate, toInputDateTimeLocal } from "@/lib/format";
import { createMatchAction, createPhaseAction, createTeamAction, updateMatchTimeAction, updateResultAction, awardChampionBonusAction } from "@/app/actions/admin";
import { BottomNav } from "../jugar/_components/BottomNav";

type Team = { id: string; name: string; flag_url: string | null };
type Phase = { id: string; name: string; sort_order: number };
type Game = {
  id: string;
  match_time: Date;
  phase_name: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
};
type User = { name: string; email: string; phone_number: string | null; created_at: Date };

type AdminPageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/jugar");

  const params = await searchParams;

  const [teams, phases, games, users] = await Promise.all([
    query<Team>(`SELECT BIN_TO_UUID(id) AS id, name, flag_url FROM teams ORDER BY name ASC`),
    query<Phase>(`SELECT BIN_TO_UUID(id) AS id, name, sort_order FROM phases ORDER BY sort_order ASC, name ASC`),
    query<Game>(
      `SELECT
        BIN_TO_UUID(g.id) AS id,
        g.match_time,
        BIN_TO_UUID(g.home_team_id) AS home_team_id,
        BIN_TO_UUID(g.away_team_id) AS away_team_id,
        ph.name AS phase_name,
        ht.name AS home_team_name,
        at.name AS away_team_name,
        g.home_score,
        g.away_score
      FROM games g
      JOIN phases ph ON ph.id = g.phase_id
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      ORDER BY g.match_time ASC`
    ),
    query<User>(`SELECT name, email, phone_number, created_at FROM users WHERE is_admin = FALSE ORDER BY created_at DESC LIMIT 200`),
  ]);

  return (
    <main className="app-shell with-nav">
      <header className="topbar admin-topbar">
        <div>
          <p className="eyebrow">Panel administrativo</p>
          <h1>Configuración</h1>
        </div>
        <Link className="secondary-button compact" href="/api/admin/users.csv">Exportar CSV</Link>
      </header>

      {params.saved && <div className="alert success">Cambio guardado: {params.saved}.</div>}
      {params.error && <div className="alert">Error: {params.error}</div>}

      <section className="admin-grid">
        <article className="admin-card">
          <h2>Crear equipo</h2>
          <form action={createTeamAction} className="stack">
            <input name="name" placeholder="Nombre del equipo" required />
            <input name="flag_url" placeholder="URL de bandera/logo opcional" />
            <button className="primary-button" type="submit">Guardar equipo</button>
          </form>
        </article>

        <article className="admin-card">
          <h2>Crear fase</h2>
          <form action={createPhaseAction} className="stack">
            <input name="name" placeholder="Ej. Octavos de final" required />
            <input name="sort_order" type="number" placeholder="Orden" defaultValue={1} />
            <button className="primary-button" type="submit">Guardar fase</button>
          </form>
        </article>

        <article className="admin-card wide">
          <h2>Crear partido</h2>
          <form action={createMatchAction} className="stack">
            <input name="match_time" type="datetime-local" required />
            <select name="phase_id" required>
              <option value="">Fase</option>
              {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
            </select>
            <select name="home_team_id" required>
              <option value="">Local</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <select name="away_team_id" required>
              <option value="">Visitante</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <button className="primary-button" type="submit">Crear partido</button>
          </form>
        </article>

        <article className="admin-card wide">
          <h2>Bonus campeón</h2>
          <form action={awardChampionBonusAction} className="stack">
            <select name="champion_team_id" required>
              <option value="">Seleccionar campeón real</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <button className="primary-button" type="submit">Asignar bonus de 10 pts</button>
          </form>
        </article>
      </section>

      <section className="admin-section">
        <h2>Partidos</h2>
        <div className="admin-list">
          {games.map((game) => (
            <article className="admin-match" key={game.id}>
              <div>
                <p className="eyebrow">{game.phase_name}</p>
                <h3>{game.home_team_name} vs {game.away_team_name}</h3>
                <p className="muted">{formatMatchDate(game.match_time)}</p>
                {game.home_score !== null && game.away_score !== null && (
                  <p className="result-strip">Resultado: {game.home_score} - {game.away_score}</p>
                )}
              </div>

              <form action={updateMatchTimeAction} className="mini-form">
                <input type="hidden" name="game_id" value={game.id} />
                <input name="match_time" type="datetime-local" defaultValue={toInputDateTimeLocal(game.match_time)} required />
                <button className="secondary-button" type="submit">Cambiar hora</button>
              </form>

              <form action={updateResultAction} className="mini-form result-form">
                <input type="hidden" name="game_id" value={game.id} />
                <input name="home_score" type="number" min="0" placeholder="Local" defaultValue={game.home_score ?? ""} required />
                <input name="away_score" type="number" min="0" placeholder="Visitante" defaultValue={game.away_score ?? ""} required />
                <select name="winner_team_id" defaultValue="">
                  <option value="">Ganador/clasificado opcional</option>
                  <option value={game.home_team_id}>{game.home_team_name}</option>
                  <option value={game.away_team_id}>{game.away_team_name}</option>
                </select>
                <button className="primary-button" type="submit">Guardar resultado</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Usuarios registrados</h2>
        <div className="user-table">
          {users.map((user) => (
            <article key={user.email} className="user-row">
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
              </div>
              <span>{user.phone_number ?? "Sin teléfono"}</span>
            </article>
          ))}
        </div>
      </section>

      <BottomNav isAdmin />
    </main>
  );
}
