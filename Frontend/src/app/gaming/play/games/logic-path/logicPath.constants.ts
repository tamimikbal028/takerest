export const TOTAL_ROUNDS = 10;
export const MAX_SKIPS = 3;
export const MAX_MISTAKES = 3;
export const POINTS_PER_CORRECT = 20;
export const PENALTY_PER_WRONG = 5;

export const LOGIC_PATH_RULES = `Program a sequence of movements to guide the character from Start (top-left) to the Target (bottom-right)! |||
  Add direction commands (Up, Down, Left, Right) to build your path. |||
  Avoid obstacles (rocks) and stay within the commands limit. |||
  🔑 Medium/Hard levels require collecting a key before entering the locked goal. |||
  🌀 Hard levels contain portal teleporters. |||
  ${MAX_MISTAKES} crashes or ${MAX_SKIPS} skips = Game Over!`;
