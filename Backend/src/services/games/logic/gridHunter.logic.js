const generateHunterRound = (level) => {
  let size = 4;
  let timeLimit = 10;

  if (level === "medium") {
    size = 5;
    timeLimit = 15;
  } else if (level === "hard") {
    size = 6;
    timeLimit = 20;
  }

  const totalCells = size * size;
  const numbers = [];

  let minRangeFloor;
  let spread;

  if (level === "easy") {
    minRangeFloor = Math.floor(Math.random() * 50) + 10;
    spread = Math.floor(Math.random() * 30) + 30;
  } else if (level === "medium") {
    minRangeFloor = Math.floor(Math.random() * 200) + 100;
    spread = Math.floor(Math.random() * 150) + 150;
  } else {
    minRangeFloor = Math.floor(Math.random() * 400) + 100;
    spread = Math.floor(Math.random() * 400) + 400;
  }

  const maxRange = Math.min(
    minRangeFloor + spread,
    level === "easy" ? 99 : level === "medium" ? 500 : 999
  );

  while (numbers.length < totalCells) {
    const num = Math.floor(
      Math.random() * (maxRange - minRangeFloor) + minRangeFloor
    );
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  const target = Math.min(...numbers);

  return {
    grid: numbers,
    target,
    size,
    timeLimit,
  };
};

/**
 * Generates grid hunter game session
 * @param {Object} config - Config from database public.games.content_config
 */
const generate = (config) => {
  const totalRounds = config.total_levels || config.total_rounds || 15;
  const easyRounds = config.easy_levels || config.easy_rounds || 5;
  const mediumRounds = config.medium_levels || config.medium_rounds || 5;
  const hardRounds = config.hard_levels || config.hard_rounds || 5;

  const levels = [];

  for (let i = 0; i < easyRounds; i++) levels.push(generateHunterRound("easy"));
  for (let i = 0; i < mediumRounds; i++) levels.push(generateHunterRound("medium"));
  for (let i = 0; i < hardRounds; i++) levels.push(generateHunterRound("hard"));

  return {
    levels,
  };
};

const redactRound = (round) => {
  if (!round) return round;
  const { target, ...rest } = round;
  return rest;
};

/**
 * Redacts target field from levels.
 */
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

/**
 * Verifies user selections.
 */
const verify = (sessionState, clientSubmission, config) => {
  const { answers } = clientSubmission; // Note: client calls it 'answers' or 'selections'. Let's support both.
  const selections = answers || clientSubmission.selections || [];
  const levels = sessionState.levels || sessionState.rounds || [];

  const pointsPerCorrect = config.points_per_correct || 10;
  const penaltyPerWrong = config.penalty_per_wrong || 5;
  const maxMistakes = config.max_mistakes || 3;
  const maxSkips = config.max_skips || 3;

  let score = 0;
  let mistakes = 0;
  let skips = 0;

  const totalRoundsEvaluated = Math.min(levels.length, selections.length);

  for (let i = 0; i < totalRoundsEvaluated; i++) {
    const round = levels[i];
    const userSelect = selections[i];

    if (userSelect === null || userSelect === undefined) {
      skips += 1;
      if (skips >= maxSkips) {
        break;
      }
    } else if (userSelect === round.target) {
      score += pointsPerCorrect;
    } else {
      score -= penaltyPerWrong;
      mistakes += 1;
      if (mistakes >= maxMistakes) {
        break;
      }
    }
  }

  const finalScore = Math.max(0, score);

  return {
    score: finalScore,
    mistakes,
    skips,
  };
};

const verifyTurn = (sessionState, answer, config) => {
  const currentIndex = sessionState.currentIndex;
  const levels = sessionState.fullState.levels || sessionState.fullState.rounds || [];
  const round = levels[currentIndex];
  
  const pointsPerCorrect = config.points_per_correct || 10;
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
  } else if (answer === round.target) {
    isCorrect = true;
    nextScore += pointsPerCorrect;
  } else {
    nextScore -= penaltyPerWrong;
    nextMistakes += 1;
  }

  nextScore = Math.max(0, nextScore);

  const completed =
    nextMistakes >= maxMistakes ||
    nextSkips >= maxSkips ||
    currentIndex + 1 >= levels.length;

  return {
    isCorrect,
    correctAnswer: round.target,
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
