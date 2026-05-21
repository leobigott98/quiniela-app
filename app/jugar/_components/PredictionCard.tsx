import { savePrediction } from "@/app/actions/predictions";
import { formatDateTime } from "@/lib/format";
import { isPredictionLocked } from "@/lib/scoring";

export type GameWithPrediction = {
  id: string;
  match_time: Date;
  phase_name: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  pred_home_score: number | null;
  pred_away_score: number | null;
  calculated_points: number | null;
};

export function PredictionCard({ game }: { game: GameWithPrediction }) {
  const locked = isPredictionLocked(new Date(game.match_time));
  const finished = game.home_score !== null && game.away_score !== null;

  return (
    <article className="card match">
      <div className="row">
        <span className="badge">{game.phase_name}</span>
        <span className={locked ? "badge locked" : "badge"}>{locked ? "Bloqueado" : "Editable"}</span>
      </div>
      <div className="small">{formatDateTime(game.match_time)}</div>

      <form action={savePrediction} className="stack">
        <input type="hidden" name="gameId" value={game.id} />
        <div className="score-grid">
          <div className="team">{game.home_team}</div>
          <input className="input" name="homeScore" type="number" min="0" max="99" defaultValue={game.pred_home_score ?? ""} disabled={locked} required />
          <div className="vs">-</div>
          <input className="input" name="awayScore" type="number" min="0" max="99" defaultValue={game.pred_away_score ?? ""} disabled={locked} required />
          <div className="team" style={{ textAlign: "right" }}>{game.away_team}</div>
        </div>
        {!locked && <button className="btn">Guardar pronóstico</button>}
      </form>

      {finished && (
        <p className="small">Resultado: {game.home_score} - {game.away_score}. Tus puntos: <strong>{game.calculated_points ?? 0}</strong></p>
      )}
    </article>
  );
}
