"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPredictionLocked } from "@/lib/scoring";

const predictionSchema = z.object({
  gameId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

type GameLockRow = { match_time: Date };

export async function savePrediction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = predictionSchema.parse({
    gameId: formData.get("gameId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });

  const game = (
    await query<GameLockRow>(`SELECT match_time FROM games WHERE id = UUID_TO_BIN(:gameId) LIMIT 1`, {
      gameId: parsed.gameId,
    })
  )[0];

  if (!game) throw new Error("Partido no encontrado.");
  if (isPredictionLocked(new Date(game.match_time))) {
    throw new Error("Este pronóstico ya está bloqueado porque falta menos de 1 hora para el partido.");
  }

  await query(
    `INSERT INTO predictions (user_id, game_id, pred_home_score, pred_away_score)
     VALUES (UUID_TO_BIN(:userId), UUID_TO_BIN(:gameId), :homeScore, :awayScore)
     ON DUPLICATE KEY UPDATE
       pred_home_score = VALUES(pred_home_score),
       pred_away_score = VALUES(pred_away_score),
       updated_at = CURRENT_TIMESTAMP`,
    {
      userId: session.id,
      gameId: parsed.gameId,
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
    }
  );

  revalidatePath("/jugar");
  revalidatePath("/ranking");
}
