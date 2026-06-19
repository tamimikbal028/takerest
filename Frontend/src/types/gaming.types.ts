export type ArcadeGameKey =
  | "math-sprint"
  | "grid-hunter"
  | "speed-equate"
  | "logical-deduction"
  | "logic-path"
  | "operator-grid"
  | "arithmetic-path"
  | "logical-deduction-2"
  | "sum-matrix";

export interface GamingProfile {
  gamerName: string;
  xp: number;
  tokens: number;
  lifetimeXP: number;
  xpFromDailyClaim: number;
  xpFromPrizes: number;
  lastClaimDate: string | null;
}

export interface GamingProfileResponse {
  profile: GamingProfile;
  meta: {
    canClaimDaily: boolean;
  };
}

export interface ArcadeGameStats {
  weeklyBestScore: number;
  weeklyBestScoreDuration: number;
  lifetimeBestScore: number;
  latestScore: number;
  latestScoreDuration: number;
  weeklyPlaysCount: number;
  lifetimePlaysCount: number;
  lastPlayedAt: string | null;
}

export interface ArcadeLeaderboardProfile {
  id: string;
  gamerName: string;
}

export interface ArcadeGameLeaderboardEntry extends ArcadeGameStats {
  rank: number | null;
  profile: ArcadeLeaderboardProfile;
}

export interface ArcadeLeaderboardResponse {
  leaderboards: Record<ArcadeGameKey, ArcadeGameLeaderboardEntry[]>;
  currentUser: {
    profile: ArcadeLeaderboardProfile;
    games: Record<ArcadeGameKey, ArcadeGameStats>;
    ranks: Record<ArcadeGameKey, number | null>;
  } | null;
}

export interface SubmitArcadeScoreResponse {
  gameKey: ArcadeGameKey;
  score: number;
  isNewHighScore: boolean;
  stats: ArcadeGameStats;
}

export interface MyGamingStatsResponse {
  profile: {
    id: string;
    gamerName: string;
    tokens: number;
    xp: number;
  };
  games: Record<ArcadeGameKey, ArcadeGameStats>;
  ranks: Record<ArcadeGameKey, number | null>;
}

export interface SubmitArcadeTurnResponse {
  completed: boolean;
  isCorrect: boolean;
  correctAnswer: any;
  score?: number;
  mistakes?: number;
  skips?: number;
  nextQuestion?: any;
  currentScore?: number;
  result?: SubmitArcadeScoreResponse;
}
