"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { query, transaction } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/scoring";

const resultSchema = z.object({
  gameId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

type PredictionRow = {
  id: string;
  pred_home_score: number;
  pred_away_score: number;
};

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/login");
}

export async function saveResult(formData: FormData) {
  await requireAdmin();
  const parsed = resultSchema.parse({
    gameId: formData.get("gameId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });

  const predictions = await query<PredictionRow>(
    `SELECT BIN_TO_UUID(id) id, pred_home_score, pred_away_score
     FROM predictions WHERE game_id = UUID_TO_BIN(:gameId)`,
    { gameId: parsed.gameId }
  );

  await transaction(async (conn) => {
    await conn.execute(
      `UPDATE games
       SET home_score = :homeScore, away_score = :awayScore, updated_at = CURRENT_TIMESTAMP
       WHERE id = UUID_TO_BIN(:gameId)`,
      parsed
    );

    for (const p of predictions) {
      const points = calculatePredictionPoints({
        predHome: p.pred_home_score,
        predAway: p.pred_away_score,
        actualHome: parsed.homeScore,
        actualAway: parsed.awayScore,
      });
      await conn.execute(
        `UPDATE predictions SET calculated_points = :points WHERE id = UUID_TO_BIN(:predictionId)`,
        { points, predictionId: p.id }
      );
    }
  });

  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/jugar");
}
