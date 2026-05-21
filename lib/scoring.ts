export function matchOutcome(home: number, away: number) {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export function calculatePredictionPoints(input: {
  predHome: number;
  predAway: number;
  actualHome: number;
  actualAway: number;
}) {
  const exact = input.predHome === input.actualHome && input.predAway === input.actualAway;
  if (exact) return 3;

  const predictedOutcome = matchOutcome(input.predHome, input.predAway);
  const actualOutcome = matchOutcome(input.actualHome, input.actualAway);
  return predictedOutcome === actualOutcome ? 1 : 0;
}

export function isPredictionLocked(matchTime: Date) {
  const oneHourBefore = new Date(matchTime.getTime() - 60 * 60 * 1000);
  return new Date() >= oneHourBefore;
}
