"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPredictionLocked } from "@/lib/scoring";
import { RowDataPacket } from "mysql2";

const pool = getPool();

export async function savePredictionAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  const gameId = String(formData.get("game_id") || "");
  const predHome = Number(formData.get("pred_home_score"));
  const predAway = Number(formData.get("pred_away_score"));

  if (!gameId || !Number.isInteger(predHome) || !Number.isInteger(predAway) || predHome < 0 || predAway < 0) {
    redirect("/jugar?error=invalid_prediction");
  }

  const [games] = await pool.query<RowDataPacket[]>(
    `SELECT match_time FROM games WHERE id = UUID_TO_BIN(:gameId) LIMIT 1`,
    { gameId }
  );

  const game = games[0];
  if (!game) redirect("/jugar?error=game_not_found");

  if (isPredictionLocked(new Date(game.match_time))) {
    redirect("/jugar?error=locked");
  }

  await pool.execute(
    `INSERT INTO predictions (user_id, game_id, pred_home_score, pred_away_score)
     VALUES (UUID_TO_BIN(:userId), UUID_TO_BIN(:gameId), :predHome, :predAway)
     ON DUPLICATE KEY UPDATE
       pred_home_score = VALUES(pred_home_score),
       pred_away_score = VALUES(pred_away_score),
       updated_at = CURRENT_TIMESTAMP`,
    { userId: session.id, gameId, predHome, predAway }
  );

  revalidatePath("/jugar");
  revalidatePath("/ranking");
  redirect("/jugar?saved=1");
}