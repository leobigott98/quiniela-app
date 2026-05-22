import { savePredictionAction } from "@/app/actions/predictions";
import { formatMatchDate } from "@/lib/format";
import { isPredictionLocked } from "@/lib/scoring";
import { SharePredictionButton } from "./SharePredictionButton";

type Props = {
  game: {
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
};

export function PredictionCard({ game }: Props) {
  const locked = isPredictionLocked(new Date(game.match_time));
  const hasPrediction = game.pred_home_score !== null && game.pred_away_score !== null;
  const finished = game.home_score !== null && game.away_score !== null;

  return (
    <article className="match-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{game.phase_name}</p>
          <h2>{game.home_team_name} vs {game.away_team_name}</h2>
        </div>
        <span className={locked ? "pill locked" : "pill open"}>{locked ? "Bloqueado" : "Abierto"}</span>
      </div>

      <p className="muted">{formatMatchDate(game.match_time)}</p>

      {finished && (
        <div className="result-strip">
          Final: {game.home_team_name} {game.home_score} - {game.away_score} {game.away_team_name}
          <strong>{game.calculated_points ?? 0} pts</strong>
        </div>
      )}

      <form action={savePredictionAction} className="prediction-form">
        <input type="hidden" name="game_id" value={game.id} />
        <label>
          {game.home_team_name}
          <input name="pred_home_score" type="number" min="0" defaultValue={game.pred_home_score ?? ""} disabled={locked} required />
        </label>
        <span className="versus">-</span>
        <label>
          {game.away_team_name}
          <input name="pred_away_score" type="number" min="0" defaultValue={game.pred_away_score ?? ""} disabled={locked} required />
        </label>
        <button className="primary-button" type="submit" disabled={locked}>Guardar</button>
      </form>

      {hasPrediction && (
        <SharePredictionButton
          homeTeam={game.home_team_name}
          awayTeam={game.away_team_name}
          predHome={game.pred_home_score!}
          predAway={game.pred_away_score!}
          matchLabel={formatMatchDate(game.match_time)}
        />
      )}
    </article>
  );
}
