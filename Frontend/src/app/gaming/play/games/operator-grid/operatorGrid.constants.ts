export const MAX_SKIPS = 3;
export const MAX_MISTAKES = 3;
export const POINTS_PER_CORRECT = 20;
export const PENALTY_PER_WRONG = 5;

export const OPERATOR_GRID_RULES =
  "You are presented with a 3x3 grid of blank slots and pre-filled math operators. ||| " +
  "A pool of 9 numbers is provided at the bottom. ||| " +
  "Row target values are displayed on the right, and column target values at the bottom. ||| " +
  "Place all 9 numbers from the pool into the blank slots in the grid. ||| " +
  "Equations are evaluated sequentially (left-to-right for rows, top-to-bottom for columns) without operator precedence (no PEMDAS). ||| " +
  "Arrange the numbers to match every row and column target simultaneously to win the level!";
