export interface ScoringParams {
  basePoints: number;
  startTime: number; // ms
  submissionTime: number; // ms
  limitSeconds: number; // seconds
}

export class ScoringService {
  /**
   * Calculates the score based on speed and base points.
   * Formula: Points = Base Points * (Time Remaining / Total Time Allowed)
   */
  calculateScore(params: ScoringParams): number {
    const { basePoints, startTime, submissionTime, limitSeconds } = params;

    if (limitSeconds <= 0) {
      return 0;
    }

    const limitMs = limitSeconds * 1000;
    const timeSpentMs = submissionTime - startTime;

    if (timeSpentMs < 0) {
      // Should not happen, but if it does, give max points
      return basePoints;
    }

    if (timeSpentMs >= limitMs) {
      return 0;
    }

    const timeRemainingMs = limitMs - timeSpentMs;
    const score = Math.floor(basePoints * (timeRemainingMs / limitMs));

    return Math.max(0, score);
  }
}
