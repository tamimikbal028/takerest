const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const evalExpr = (a, op, b) => {
  if (a === null || b === null) return null;
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  if (op === "/") {
    if (b === 0 || a % b !== 0) return null; // Integer division only
    return a / b;
  }
  return null;
};

const evaluateUserGrid = (gridNumbers, rowTargets, colTargets, hOps, vOps) => {
  if (!Array.isArray(hOps) || hOps.length !== 6 || !Array.isArray(vOps) || vOps.length !== 6) {
    return false;
  }

  // Row evaluations (left-to-right)
  const row0 = evalExpr(evalExpr(gridNumbers[0], hOps[0], gridNumbers[1]), hOps[1], gridNumbers[2]);
  const row1 = evalExpr(evalExpr(gridNumbers[3], hOps[2], gridNumbers[4]), hOps[3], gridNumbers[5]);
  const row2 = evalExpr(evalExpr(gridNumbers[6], hOps[4], gridNumbers[7]), hOps[5], gridNumbers[8]);

  if (row0 !== rowTargets[0] || row1 !== rowTargets[1] || row2 !== rowTargets[2]) {
    return false;
  }

  // Column evaluations (top-to-bottom)
  const col0 = evalExpr(evalExpr(gridNumbers[0], vOps[0], gridNumbers[3]), vOps[1], gridNumbers[6]);
  const col1 = evalExpr(evalExpr(gridNumbers[1], vOps[2], gridNumbers[4]), vOps[3], gridNumbers[7]);
  const col2 = evalExpr(evalExpr(gridNumbers[2], vOps[4], gridNumbers[5]), vOps[5], gridNumbers[8]);

  if (col0 !== colTargets[0] || col1 !== colTargets[1] || col2 !== colTargets[2]) {
    return false;
  }

  return true;
};

const generateGrid = (difficulty) => {
  const allowedOps =
    difficulty === "easy"
      ? ["+", "-"]
      : difficulty === "medium"
        ? ["+", "-", "*"]
        : ["+", "-", "*", "/"];

  const numMin = 1;
  const numMax = difficulty === "easy" ? 6 : 9;

  let attempts = 0;
  while (attempts < 2000) {
    attempts++;
    // Generate 9 grid numbers
    const nums = Array.from({ length: 9 }, () => randomBetween(numMin, numMax));

    // Choose 12 random operators
    const hOps = Array.from(
      { length: 6 },
      () => allowedOps[Math.floor(Math.random() * allowedOps.length)]
    );
    const vOps = Array.from(
      { length: 6 },
      () => allowedOps[Math.floor(Math.random() * allowedOps.length)]
    );

    // Row evaluations
    const row0 = evalExpr(evalExpr(nums[0], hOps[0], nums[1]), hOps[1], nums[2]);
    const row1 = evalExpr(evalExpr(nums[3], hOps[2], nums[4]), hOps[3], nums[5]);
    const row2 = evalExpr(evalExpr(nums[6], hOps[4], nums[7]), hOps[5], nums[8]);

    if (row0 === null || row1 === null || row2 === null) continue;

    // Col evaluations
    const col0 = evalExpr(evalExpr(nums[0], vOps[0], nums[3]), vOps[1], nums[6]);
    const col1 = evalExpr(evalExpr(nums[1], vOps[2], nums[4]), vOps[3], nums[7]);
    const col2 = evalExpr(evalExpr(nums[2], vOps[4], nums[5]), vOps[5], nums[8]);

    if (col0 === null || col1 === null || col2 === null) continue;

    // Found valid puzzle
    return {
      gridNumbers: nums,
      rowTargets: [row0, row1, row2],
      colTargets: [col0, col1, col2],
      correctHorizontalOperators: hOps,
      correctVerticalOperators: vOps,
      timeLimit: difficulty === "easy" ? 40 : difficulty === "medium" ? 50 : 65,
    };
  }

  // Fallback simple grid
  return {
    gridNumbers: [2, 3, 4, 1, 5, 2, 3, 2, 1],
    rowTargets: [9, 7, 7],
    colTargets: [6, 10, 7],
    correctHorizontalOperators: ["+", "*", "+", "*", "*", "+"],
    correctVerticalOperators: ["*", "+", "+", "*", "*", "+"],
    timeLimit: 40,
  };
};

const generate = (config) => {
  const easyRounds = config.easy_levels || config.easy_rounds || 3;
  const mediumRounds = config.medium_levels || config.medium_rounds || 3;
  const hardRounds = config.hard_levels || config.hard_rounds || 4;

  const levels = [];
  for (let i = 0; i < easyRounds; i++) {
    levels.push(generateGrid("easy"));
  }
  for (let i = 0; i < mediumRounds; i++) {
    levels.push(generateGrid("medium"));
  }
  for (let i = 0; i < hardRounds; i++) {
    levels.push(generateGrid("hard"));
  }

  return { levels };
};

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const redactRound = (round) => {
  if (!round) return round;
  const { gridNumbers, ...rest } = round;
  return {
    ...rest,
    numbersPool: shuffle(gridNumbers),
  };
};

const redact = (sessionState) => {
  if (!sessionState) return sessionState;
  const levels = sessionState.levels || sessionState.rounds;
  if (!levels) return sessionState;
  const redactedItems = levels.map(redactRound);
  return {
    ...sessionState,
    [sessionState.levels ? "levels" : "rounds"]: redactedItems,
  };
};

const verify = (sessionState, clientSubmission, config) => {
  const { answers } = clientSubmission;
  const submissions = answers || [];
  const levels = sessionState.levels || sessionState.rounds || [];

  const pointsPerCorrect = config.points_per_correct || 20;
  const penaltyPerWrong = config.penalty_per_wrong || 5;
  const maxMistakes = config.max_mistakes || 3;
  const maxSkips = config.max_skips || 3;

  let score = 0;
  let mistakes = 0;
  let skips = 0;

  const totalRoundsEvaluated = Math.min(levels.length, submissions.length);

  for (let i = 0; i < totalRoundsEvaluated; i++) {
    const round = levels[i];
    const userAns = submissions[i]; // expect { gridNumbers }

    if (userAns === null || userAns === undefined) {
      skips += 1;
      if (skips >= maxSkips) break;
    } else {
      const isCorrect = evaluateUserGrid(
        userAns.gridNumbers,
        round.rowTargets,
        round.colTargets,
        round.correctHorizontalOperators,
        round.correctVerticalOperators
      );

      if (isCorrect) {
        score += pointsPerCorrect;
      } else {
        score -= penaltyPerWrong;
        mistakes += 1;
        if (mistakes >= maxMistakes) break;
      }
    }
  }

  return {
    score: Math.max(0, score),
    mistakes,
    skips,
  };
};

const verifyTurn = (sessionState, answer, config) => {
  const currentIndex = sessionState.currentIndex;
  const levels = sessionState.fullState.levels || sessionState.fullState.rounds || [];
  const round = levels[currentIndex];

  const pointsPerCorrect = config.points_per_correct || 20;
  const penaltyPerWrong = config.penalty_per_wrong || 5;
  const maxMistakes = config.max_mistakes || 3;
  const maxSkips = config.max_skips || 3;

  let isCorrect = false;
  let skipped = false;

  let nextScore = sessionState.score || 0;
  let nextMistakes = sessionState.mistakes || 0;
  let nextSkips = sessionState.skips || 0;

  if (answer === null || answer === undefined) {
    skipped = true;
    nextSkips += 1;
  } else {
    isCorrect = evaluateUserGrid(
      answer.gridNumbers,
      round.rowTargets,
      round.colTargets,
      round.correctHorizontalOperators,
      round.correctVerticalOperators
    );

    if (isCorrect) {
      nextScore += pointsPerCorrect;
    } else {
      nextScore -= penaltyPerWrong;
      nextMistakes += 1;
    }
  }

  nextScore = Math.max(0, nextScore);

  const completed =
    nextMistakes >= maxMistakes ||
    nextSkips >= maxSkips ||
    currentIndex + 1 >= levels.length;

  return {
    isCorrect,
    correctAnswer: {
      correctGridNumbers: round.gridNumbers,
    },
    nextScore,
    nextMistakes,
    nextSkips,
    completed,
  };
};

export default {
  generate,
  redact,
  verify,
  verifyTurn,
  redactRound,
  redactLevel: redactRound,
};
