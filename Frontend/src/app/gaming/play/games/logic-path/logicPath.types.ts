export type Direction = "up" | "down" | "left" | "right";

export interface LogicPathRound {
  gridSize: number;
  start: [number, number];
  end: [number, number];
  obstacles: Array<[number, number]>;
  key: [number, number] | null;
  portals: Array<[number, number]> | null; // [entrance, exit]
  commandsLimit: number;
  timeLimit: number;
}

export interface SimulationResult {
  success: boolean;
  pathTaken: Array<[number, number]>;
  reason?: string;
}

import type { SubmitArcadeTurnResponse } from "@/types";

export interface LogicPathTurnResponse
  extends Omit<SubmitArcadeTurnResponse, "nextQuestion"> {
  simulation?: SimulationResult;
  nextQuestion?: LogicPathRound;
}
