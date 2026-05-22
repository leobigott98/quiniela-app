import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { PredictionCard } from "./_components/PredictionCard";
import { BottomNav } from "./_components/BottomNav";

type GameRow = {
  id: string;
  match_time: Date;
  phase_name: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  pred_home_score: number | null;
  pred_away_score: number | null;
  calculated_points: number | null;
};

type PageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function PlayPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  const params = await searchParams;
  const games = await query<GameRow>(
    `SELECT
      BIN_TO_UUID(g.id) AS id,
      g.match_time,
      ph.name AS phase_name,
      ht.name AS home_team_name,
      at.name AS away_team_name,
      g.home_score,
      g.away_score,
      p.pred_home_score,
      p.pred_away_score,
      p.calculated_points
    FROM games g
    JOIN phases ph ON ph.id = g.phase_id
    JOIN teams ht ON ht.id = g.home_team_id
    JOIN teams at ON at.id = g.away_team_id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = UUID_TO_BIN(:userId)
    ORDER BY g.match_time ASC`,
    { userId: session.id }
  );

  return (
    <main className="app-shell with-nav">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hola, {session.name}</p>
          <h1>Haz tus pronósticos</h1>
        </div>
      </header>

      {params.saved && <div className="alert success">Pronóstico guardado.</div>}
      {params.error && <div className="alert">No se pudo guardar. Revisa si el partido ya está bloqueado.</div>}

      <section className="match-list">
        {games.map((game) => <PredictionCard key={game.id} game={game} />)}
        {games.length === 0 && <p className="empty">Aún no hay partidos cargados.</p>}
      </section>

      <BottomNav isAdmin={false} />
    </main>
  );
}

