import type { SubmitArcadeTurnResponse } from "@/types";

export interface SumMatrixRound {
  size: number;
  gridNumbers: number[];
  rowTargets: number[];
  colTargets: number[];
  timeLimit: number;
}

export interface SumMatrixTurnResponse
  extends Omit<SubmitArcadeTurnResponse, "nextQuestion"> {
  nextQuestion?: SumMatrixRound;
}
