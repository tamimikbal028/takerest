export const TOTAL_ROUNDS = 10;
export const ATTEMPTS_PER_ROUND = 10;
export const MAX_SKIPS = 3;
export const MAX_MISTAKES = 3;
export const POINTS_PER_CORRECT = 20;
export const PENALTY_PER_WRONG = 2;

export const LOGICAL_DEDUCTION_RULES = `Crack ${TOTAL_ROUNDS} levels of secret 4-digit codes! |||
  Each code consists of 4 unique digits (0–9) with no repeats. |||
  You have ${ATTEMPTS_PER_ROUND} guesses per level. |||
  🟢 Green indicator = count of correct digits in the right positions. |||
  🟡 Yellow indicator = count of correct digits in the wrong positions. |||
  ${MAX_MISTAKES} mistakes or ${MAX_SKIPS} skips = Game Over!`;
