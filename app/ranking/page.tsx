import { query } from "@/lib/db";
import { BottomNav } from "@/app/jugar/_components/BottomNav";

type LeaderRow = {
  name: string;
  total_points: number;
  predictions_count: number;
  exact_hits: number;
  partial_hits: number;
};

export default async function RankingPage() {
  const leaders = await query<LeaderRow>(`SELECT * FROM leaderboard LIMIT 100`);

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Tabla de posiciones</div>
        <h1>Ranking</h1>
        <p>Se actualiza cuando el admin carga resultados finales.</p>
      </section>
      <div className="stack">
        {leaders.map((leader, index) => (
          <article className="card leader" key={`${leader.name}-${index}`}>
            <div className="rank">{index + 1}</div>
            <div>
              <strong>{leader.name}</strong>
              <div className="small">{leader.exact_hits ?? 0} exactos · {leader.partial_hits ?? 0} parciales · {leader.predictions_count ?? 0} pronósticos</div>
            </div>
            <strong>{leader.total_points} pts</strong>
          </article>
        ))}
      </div>
      <BottomNav active="ranking" />
    </main>
  );
}
