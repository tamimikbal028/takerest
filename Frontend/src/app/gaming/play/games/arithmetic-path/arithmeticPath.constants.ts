export const MAX_SKIPS = 3;
export const MAX_MISTAKES = 3;
export const POINTS_PER_CORRECT = 20;
export const PENALTY_PER_WRONG = 5;

export const ARITHMETIC_PATH_RULES =
  "You start with a Start Value in the top-left cell. ||| " +
  "Trace a continuous path of adjacent cells (horizontally or vertically) to reach the bottom-right cell. ||| " +
  "As you trace the path, each cell's math operation (+, -, *, /) will be applied sequentially to your running total. ||| " +
  "You cannot visit the same cell twice. ||| " +
  "Your path must reach the bottom-right cell and your final running total must EXACTLY match the Target Value. ||| " +
  "Use the SVG path drawing to guide your steps, and click Submit Path once you reach the target!";
