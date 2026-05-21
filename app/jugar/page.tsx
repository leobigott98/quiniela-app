import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { BottomNav } from "./_components/BottomNav";
import { PredictionCard, GameWithPrediction } from "./_components/PredictionCard";

export default async function PlayPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const games = await query<GameWithPrediction>(
    `SELECT
      BIN_TO_UUID(g.id) id,
      g.match_time,
      ph.name phase_name,
      ht.name home_team,
      at.name away_team,
      g.home_score,
      g.away_score,
      p.pred_home_score,
      p.pred_away_score,
      p.calculated_points
    FROM games g
    JOIN teams ht ON ht.id = g.home_team_id
    JOIN teams at ON at.id = g.away_team_id
    JOIN phases ph ON ph.id = g.phase_id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = UUID_TO_BIN(:userId)
    ORDER BY g.match_time ASC`,
    { userId: session.id }
  );

  return (
    <main className="shell">
      <section className="hero row">
        <div>
          <div className="eyebrow">Hola, {session.name}</div>
          <h1>Pronósticos</h1>
          <p>Guarda tus marcadores antes de que se bloqueen.</p>
        </div>
        <form action={logout}><button className="btn ghost" style={{ width: "auto" }}>Salir</button></form>
      </section>
      <div className="stack">
        {games.map((game) => <PredictionCard key={game.id} game={game} />)}
        {games.length === 0 && <div className="card"><p>No hay partidos cargados todavía.</p></div>}
      </div>
      <BottomNav active="jugar" />
    </main>
  );
}
