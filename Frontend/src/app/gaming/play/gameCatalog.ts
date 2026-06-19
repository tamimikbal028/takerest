import type { ArcadeGameKey } from "@/types";

export interface ArcadeGame {
  key: ArcadeGameKey;
  label: string;
  description: string;
}

export const arcadeGames: ArcadeGame[] = [
  {
    key: "math-sprint",
    label: "Math Sprint",
    description: "Answer quick-fire math questions and bank clean points.",
  },
  {
    key: "grid-hunter",
    label: "Grid Hunter",
    description:
      "Scan the grid and find the smallest number as fast as you can.",
  },
  {
    key: "speed-equate",
    label: "Speed Equate",
    description: "Assemble numbers and operators to match the target value.",
  },
  {
    key: "logical-deduction",
    label: "Logical Deduction",
    description:
      "Crack the hidden 4-digit code using green & yellow clues. Pure logic, no luck.",
  },
  {
    key: "logic-path",
    label: "Logic Path",
    description:
      "Program a sequence of arrows to guide the character to the destination, avoiding obstacles.",
  },
  {
    key: "operator-grid",
    label: "Operator Grid",
    description:
      "Place operators (+, -, *, /) in a grid of numbers to satisfy the row and column target values.",
  },
  {
    key: "arithmetic-path",
    label: "Arithmetic Path",
    description:
      "Trace a continuous path from top-left to bottom-right that calculates to the target value.",
  },
  {
    key: "logical-deduction-2",
    label: "Logical Deduction 2",
    description:
      "Crack the secret 4-digit code using mathematical clues about the digits.",
  },
  {
    key: "sum-matrix",
    label: "Sum Matrix",
    description:
      "Rearrange numbers in a grid to satisfy the row and column target sums.",
  },
];
