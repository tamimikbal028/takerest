export const TOTAL_LEVELS = 5;
export const QUESTIONS_PER_LEVEL = 5;
export const TOTAL_QUESTIONS = TOTAL_LEVELS * QUESTIONS_PER_LEVEL;

export const MAX_SKIPS = 3;
export const MAX_MISTAKES = 3;
export const POINTS_PER_CORRECT = 10;
export const PENALTY_PER_WRONG = 5;

export const MATH_SPRINT_RULES = `Conquer 5 Pure Algebra Levels! |||
    Each Level has ${QUESTIONS_PER_LEVEL} questions. |||
    Level 1: Linear Solve: ax+b=c |||
    Level 2: Variables on Both Sides: ax+b=cx+d |||
    Level 3: Algebraic Fractions: (ax+b)/c=d |||
    Level 4: Root Equations: √(ax+b)=c |||
    Level 5: Quadratic Equations: x²+bx+c=0`;
