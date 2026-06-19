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

const generatePath = (size) => {
  const endR = size - 1;
  const endC = size - 1;

  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const path = [];

  const dfs = (r, c) => {
    visited[r][c] = true;
    path.push([r, c]);

    if (r === endR && c === endC) {
      return true;
    }

    const dirs = [
      [0, 1], // Right
      [1, 0], // Down
      [0, -1], // Left
      [-1, 0], // Up
    ];
    // Shuffle directions
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        if (dfs(nr, nc)) {
          return true;
        }
      }
    }

    path.pop();
    visited[r][c] = false;
    return false;
  };

  dfs(0, 0);
  return path;
};

const generateGrid = (difficulty) => {
  const size = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const timeLimit =
    difficulty === "easy" ? 40 : difficulty === "medium" ? 55 : 75;

  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const path = generatePath(size);
    if (!path || path.length < size * 2 - 1) continue;

    const startValue = randomBetween(2, 15);
    const grid = Array(size * size).fill(null);
    let currentVal = startValue;
    let validMath = true;

    const pathIndices = path.map(([r, c]) => r * size + c);

    // Cell 0 is the starting value itself, with no operator
    grid[pathIndices[0]] = { op: "", val: startValue };

    // Fill path cells with solvable math equations starting from step 1
    for (let i = 1; i < pathIndices.length; i++) {
      const idx = pathIndices[i];
      const allowedOps = ["+"];

      if (currentVal > 2) {
        allowedOps.push("-");
      }

      const maxValLimit = difficulty === "hard" ? 250 : 120;
      if (
        difficulty !== "easy" &&
        currentVal < maxValLimit / 2 &&
        currentVal > 1
      ) {
        allowedOps.push("*");
      }

      if (difficulty === "hard" && currentVal > 1) {
        const factors = [];
        for (let f = 2; f <= 5; f++) {
          if (currentVal % f === 0) {
            factors.push(f);
          }
        }
        if (factors.length > 0) {
          allowedOps.push("/");
        }
      }

      const op = allowedOps[Math.floor(Math.random() * allowedOps.length)];
      let val = 1;

      if (op === "+") {
        const maxAdd = difficulty === "hard" ? 15 : 9;
        val = randomBetween(1, maxAdd);
      } else if (op === "-") {
        const maxSub = difficulty === "hard" ? 15 : 9;
        const limit = Math.min(maxSub, currentVal - 1);
        val = limit >= 1 ? randomBetween(1, limit) : 1;
      } else if (op === "*") {
        const maxMult = difficulty === "hard" ? 4 : 3;
        const limit = Math.min(maxMult, Math.floor(maxValLimit / currentVal));
        val = limit >= 2 ? randomBetween(2, limit) : 2;
      } else if (op === "/") {
        const factors = [];
        for (let f = 2; f <= 5; f++) {
          if (currentVal % f === 0) {
            factors.push(f);
          }
        }
        val = factors[Math.floor(Math.random() * factors.length)];
      }

      const nextVal = evalExpr(currentVal, op, val);
      if (nextVal === null || nextVal <= 0 || nextVal > maxValLimit) {
        validMath = false;
        break;
      }

      currentVal = nextVal;
      grid[idx] = { op, val };
    }

    if (!validMath) continue;

    // Fill remaining grid cells with random decoys
    for (let idx = 0; idx < grid.length; idx++) {
      if (grid[idx] === null) {
        const ops =
          difficulty === "easy"
            ? ["+", "-"]
            : difficulty === "medium"
              ? ["+", "-", "*"]
              : ["+", "-", "*", "/"];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let val = 1;
        if (op === "+") {
          val = randomBetween(1, 9);
        } else if (op === "-") {
          val = randomBetween(1, 9);
        } else if (op === "*") {
          val = randomBetween(2, 3);
        } else if (op === "/") {
          val = randomBetween(2, 3);
        }
        grid[idx] = { op, val };
      }
    }

    return {
      grid,
      size,
      startValue,
      targetValue: currentVal,
      correctPath: pathIndices,
      timeLimit,
    };
  }

  // Fallback simple level
  return {
    grid: [
      { op: "", val: 5 },
      { op: "-", val: 2 },
      { op: "*", val: 2 },
      { op: "*", val: 3 },
      { op: "+", val: 4 },
      { op: "-", val: 1 },
      { op: "-", val: 3 },
      { op: "*", val: 2 },
      { op: "+", val: 6 },
    ],
    size: 3,
    startValue: 5,
    targetValue: 44,
    correctPath: [0, 3, 4, 7, 8],
    timeLimit: 40,
  };
};

const validateUserPath = (submittedPath, grid, size, targetValue) => {
  if (!Array.isArray(submittedPath) || submittedPath.length === 0) {
    return false;
  }

  if (submittedPath[0] !== 0) return false;

  const endIdx = size * size - 1;
  if (submittedPath[submittedPath.length - 1] !== endIdx) return false;

  const visited = new Set();
  const startCell = grid[0];
  if (!startCell) return false;

  let currentVal = startCell.val;
  visited.add(0);

  for (let i = 1; i < submittedPath.length; i++) {
    const idx = submittedPath[i];

    if (idx < 0 || idx >= grid.length) return false;

    if (visited.has(idx)) return false;
    visited.add(idx);

    const prevIdx = submittedPath[i - 1];
    const r1 = Math.floor(prevIdx / size);
    const c1 = prevIdx % size;
    const r2 = Math.floor(idx / size);
    const c2 = idx % size;
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) return false;

    const cell = grid[idx];
    if (!cell) return false;

    currentVal = evalExpr(currentVal, cell.op, cell.val);
    if (currentVal === null) return false;
  }

  return currentVal === targetValue;
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

const redactRound = (round) => {
  if (!round) return round;
  const { correctPath, ...rest } = round;
  return rest;
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
    const userAns = submissions[i]; // expect { path } or null

    if (userAns === null || userAns === undefined) {
      skips += 1;
      if (skips >= maxSkips) break;
    } else {
      const path = Array.isArray(userAns) ? userAns : userAns.path || [];
      const isCorrect = validateUserPath(
        path,
        round.grid,
        round.size,
        round.targetValue
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
  const levels =
    sessionState.fullState.levels || sessionState.fullState.rounds || [];
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
    const path = Array.isArray(answer) ? answer : answer.path || [];
    isCorrect = validateUserPath(
      path,
      round.grid,
      round.size,
      round.targetValue
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
      correctPath: round.correctPath,
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
