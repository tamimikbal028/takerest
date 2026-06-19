const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to calculate row and column sums for a grid
const calculateSums = (grid, size) => {
  const rowSums = Array(size).fill(0);
  const colSums = Array(size).fill(0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r * size + c];
      rowSums[r] += val;
      colSums[c] += val;
    }
  }

  return { rowSums, colSums };
};

// Check if a grid is solved matching targets
const isGridSolved = (grid, size, rowTargets, colTargets) => {
  const { rowSums, colSums } = calculateSums(grid, size);

  for (let i = 0; i < size; i++) {
    if (rowSums[i] !== rowTargets[i] || colSums[i] !== colTargets[i]) {
      return false;
    }
  }
  return true;
};

// Perform adjacent swaps to shuffle a grid
const shuffleGrid = (grid, size, rowTargets, colTargets, swapCount) => {
  const shuffled = [...grid];
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    for (let i = 0; i < swapCount; i++) {
      const idx1 = randomBetween(0, size * size - 1);
      const r1 = Math.floor(idx1 / size);
      const c1 = idx1 % size;

      // Choose random direction to swap (0: Right, 1: Down)
      const dir = randomBetween(0, 1);
      let idx2 = -1;

      if (dir === 0 && c1 < size - 1) {
        idx2 = idx1 + 1; // Swap with right neighbor
      } else if (dir === 1 && r1 < size - 1) {
        idx2 = idx1 + size; // Swap with down neighbor
      }

      if (idx2 !== -1) {
        const temp = shuffled[idx1];
        shuffled[idx1] = shuffled[idx2];
        shuffled[idx2] = temp;
      }
    }

    // Ensure it's not already solved
    if (!isGridSolved(shuffled, size, rowTargets, colTargets)) {
      return shuffled;
    }
  }

  return shuffled;
};

const generateLevel = (difficulty) => {
  const size = difficulty === "easy" ? 3 : 4;
  const numMin = 1;
  const numMax = difficulty === "hard" ? 15 : 9;
  const swapCount = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 12;

  // Generate solved grid of unique or semi-unique random numbers
  const grid = [];
  for (let i = 0; i < size * size; i++) {
    grid.push(randomBetween(numMin, numMax));
  }

  const { rowSums, colSums } = calculateSums(grid, size);
  const shuffledGrid = shuffleGrid(grid, size, rowSums, colSums, swapCount);

  return {
    size,
    gridNumbers: shuffledGrid,
    rowTargets: rowSums,
    colTargets: colSums,
    timeLimit: size === 3 ? 45 : 65,
  };
};

const generate = (config) => {
  const easyLevels = config.easy_levels || 3;
  const mediumLevels = config.medium_levels || 3;
  const hardLevels = config.hard_levels || 4;

  const levels = [];
  for (let i = 0; i < easyLevels; i++) {
    levels.push(generateLevel("easy"));
  }
  for (let i = 0; i < mediumLevels; i++) {
    levels.push(generateLevel("medium"));
  }
  for (let i = 0; i < hardLevels; i++) {
    levels.push(generateLevel("hard"));
  }

  return { levels };
};

const redactRound = (level) => {
  // All fields (size, gridNumbers, rowTargets, colTargets, timeLimit) are public.
  // There is no hidden solution that needs redaction.
  return level;
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

// Validate if user-submitted grid matches initial multiset of numbers
const isValidMultiset = (shuffledGrid, userGrid) => {
  if (!Array.isArray(shuffledGrid) || !Array.isArray(userGrid) || shuffledGrid.length !== userGrid.length) {
    return false;
  }
  const s1 = [...shuffledGrid].sort((a, b) => a - b);
  const s2 = [...userGrid].sort((a, b) => a - b);
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) return false;
  }
  return true;
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
      const isCorrect =
        isValidMultiset(round.gridNumbers, userAns.gridNumbers) &&
        isGridSolved(userAns.gridNumbers, round.size, round.rowTargets, round.colTargets);

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
    isCorrect =
      isValidMultiset(round.gridNumbers, answer.gridNumbers) &&
      isGridSolved(answer.gridNumbers, round.size, round.rowTargets, round.colTargets);

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
    correctAnswer: null, // Multiple valid solved states might exist
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
