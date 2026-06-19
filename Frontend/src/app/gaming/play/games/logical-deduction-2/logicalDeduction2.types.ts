export interface GuessHistory {
  guess: number[];
  green: number;
  yellow: number;
}

export interface LogicalDeduction2Round {
  attemptsAllowed: number;
  timeLimit: number;
  guesses: GuessHistory[];
  clues: string[];
  solved: boolean;
}

export interface LogicalDeduction2TurnResponse {
  completed: boolean;
  isCorrect: boolean;
  correctAnswer?: number[] | null;
  green?: number;
  yellow?: number;
  guess?: number[];
  guessesUsed?: number;
  attemptsAllowed?: number;
  roundSolved?: boolean;
  skipped?: boolean;
  nextScore?: number;
  currentScore?: number;
  score?: number;
  nextMistakes?: number;
  mistakes?: number;
  nextSkips?: number;
  skips?: number;
  roundCompleted?: boolean;
  nextRound?: LogicalDeduction2Round | null;
  clues?: string[];
}
