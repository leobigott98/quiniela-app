import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { BottomNav } from "../jugar/_components/BottomNav";

type LeaderboardRow = {
  name: string;
  total_points: number;
  exact_hits: number;
  partial_hits: number;
  predictions_count: number;
};

export default async function RankingPage() {
  const session = await getSession();
  const rows = await query<LeaderboardRow>(`SELECT * FROM leaderboard LIMIT 100`);

  return (
    <main className="app-shell with-nav">
      <header className="topbar">
        <div>
          <p className="eyebrow">Tabla de posiciones</p>
          <h1>Ranking general</h1>
        </div>
      </header>

      <section className="leaderboard">
        {rows.map((row, index) => (
          <article className="rank-card" key={`${row.name}-${index}`}>
            <strong className="rank">#{index + 1}</strong>
            <div>
              <h2>{row.name}</h2>
              <p>{row.exact_hits} exactos · {row.partial_hits} parciales · {row.predictions_count} jugados</p>
            </div>
            <strong className="points">{row.total_points} pts</strong>
          </article>
        ))}
        {rows.length === 0 && <p className="empty">Todavía no hay participantes.</p>}
      </section>

      {session && <BottomNav isAdmin={session.isAdmin} />}
    </main>
  );
}

