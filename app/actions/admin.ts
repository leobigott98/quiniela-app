"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { calculatePredictionPoints, matchOutcome } from "@/lib/scoring";
import { RowDataPacket } from "mysql2";

const pool = getPool();

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/jugar");
  return session;
}

function asNullableUuid(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const flagUrl = String(formData.get("flag_url") || "").trim() || null;
  if (!name) redirect("/admin?error=team_name_required");

  await pool.execute(
    `INSERT INTO teams (name, flag_url) VALUES (:name, :flagUrl)
     ON DUPLICATE KEY UPDATE flag_url = VALUES(flag_url), updated_at = CURRENT_TIMESTAMP`,
    { name, flagUrl }
  );

  revalidatePath("/admin");
  redirect("/admin?saved=team");
}

export async function createPhaseAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);
  if (!name) redirect("/admin?error=phase_name_required");

  await pool.execute(
    `INSERT INTO phases (name, sort_order) VALUES (:name, :sortOrder)
     ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), updated_at = CURRENT_TIMESTAMP`,
    { name, sortOrder }
  );

  revalidatePath("/admin");
  redirect("/admin?saved=phase");
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const matchTime = String(formData.get("match_time") || "");
  const homeTeamId = String(formData.get("home_team_id") || "");
  const awayTeamId = String(formData.get("away_team_id") || "");
  const phaseId = String(formData.get("phase_id") || "");

  if (!matchTime || !homeTeamId || !awayTeamId || !phaseId || homeTeamId === awayTeamId) {
    redirect("/admin?error=invalid_match");
  }

  await pool.execute(
    `INSERT INTO games (match_time, home_team_id, away_team_id, phase_id)
     VALUES (:matchTime, UUID_TO_BIN(:homeTeamId), UUID_TO_BIN(:awayTeamId), UUID_TO_BIN(:phaseId))`,
    { matchTime: matchTime.replace("T", " ") + ":00", homeTeamId, awayTeamId, phaseId }
  );

  revalidatePath("/admin");
  revalidatePath("/jugar");
  redirect("/admin?saved=match");
}

export async function updateMatchTimeAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("game_id") || "");
  const matchTime = String(formData.get("match_time") || "");
  if (!gameId || !matchTime) redirect("/admin?error=invalid_time_update");

  await pool.execute(
    `UPDATE games SET match_time = :matchTime, updated_at = CURRENT_TIMESTAMP WHERE id = UUID_TO_BIN(:gameId)`,
    { gameId, matchTime: matchTime.replace("T", " ") + ":00" }
  );

  revalidatePath("/admin");
  revalidatePath("/jugar");
  redirect("/admin?saved=time");
}

export async function updateResultAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("game_id") || "");
  const homeScore = Number(formData.get("home_score"));
  const awayScore = Number(formData.get("away_score"));
  const winnerTeamId = asNullableUuid(formData.get("winner_team_id"));

  if (!gameId || !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    redirect("/admin?error=invalid_result");
  }

  await pool.execute(
    `UPDATE games
     SET home_score = :homeScore,
         away_score = :awayScore,
         winner_team_id = IF(:winnerTeamId IS NULL, NULL, UUID_TO_BIN(:winnerTeamId)),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = UUID_TO_BIN(:gameId)`,
    { gameId, homeScore, awayScore, winnerTeamId }
  );

  const [predictions] = await pool.query<RowDataPacket[]>(
    `SELECT BIN_TO_UUID(id) AS id, pred_home_score, pred_away_score
     FROM predictions
     WHERE game_id = UUID_TO_BIN(:gameId)`,
    { gameId }
  );

  for (const prediction of predictions) {
    const points = calculatePredictionPoints({
      predHome: prediction.pred_home_score,
      predAway: prediction.pred_away_score,
      actualHome: homeScore,
      actualAway: awayScore,
    });

    await pool.execute(
      `UPDATE predictions SET calculated_points = :points, updated_at = CURRENT_TIMESTAMP WHERE id = UUID_TO_BIN(:predictionId)`,
      { points, predictionId: prediction.id }
    );
  }

  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/jugar");
  redirect("/admin?saved=result");
}

export async function awardChampionBonusAction(formData: FormData) {
  await requireAdmin();
  const championTeamId = String(formData.get("champion_team_id") || "");
  if (!championTeamId) redirect("/admin?error=champion_required");

  await pool.execute(
    `UPDATE tournament_winner_predictions
     SET awarded_points = CASE WHEN team_id = UUID_TO_BIN(:championTeamId) THEN 10 ELSE 0 END`,
    { championTeamId }
  );

  revalidatePath("/admin");
  revalidatePath("/ranking");
  redirect("/admin?saved=champion");
}