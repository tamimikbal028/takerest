export interface GuessRow {
  guess: number[];
  green: number;
  yellow: number;
}

// A single round received from the server (secret stripped)
export interface LogicalDeductionRound {
  attemptsAllowed: number;
  timeLimit: number;
  guesses: GuessRow[];
  solved: boolean;
}

// What the server returns on game start (firstQuestion)
export type LogicalDeductionFirstQuestion = LogicalDeductionRound;

// Response from submitTurn
export interface LogicalDeductionTurnResponse {
  completed: boolean;
  isCorrect: boolean;
  correctAnswer: number[] | null;
  green: number;
  yellow: number;
  guess: number[] | null;
  guessesUsed: number;
  attemptsAllowed: number;
  roundSolved: boolean;
  skipped: boolean;
  nextScore: number;
  nextMistakes: number;
  nextSkips: number;
  roundCompleted: boolean;
  nextRound: LogicalDeductionRound | null;
  // set when game completes
  score?: number;
  mistakes?: number;
  skips?: number;
  currentScore?: number;
  result?: {
    gameKey: string;
    score: number;
    isNewHighScore: boolean;
  };
}
