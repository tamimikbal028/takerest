const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates a random non-repeating 4-digit code as an array of digits.
 * e.g. [3, 7, 1, 9]
 */
const generateSecretCode = () => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates shuffle
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4);
};

/**
 * Generates exactly 5 true mathematical clues for a given 4-digit secret code.
 */
const generateClues = (code) => {
  const [d0, d1, d2, d3] = code;
  const pool = [];

  // 1. Basic Sums
  pool.push(`The sum of the first two digits is ${d0 + d1}.`);
  pool.push(`The sum of the last two digits is ${d2 + d3}.`);
  pool.push(`The sum of all four digits is ${d0 + d1 + d2 + d3}.`);

  // 2. Product
  const prod = d0 * d1 * d2 * d3;
  pool.push(`The product of all four digits is ${prod}.`);

  // 3. Multiplier Check
  let multiplierFound = false;
  if (d0 === 2 * d1) {
    pool.push("The first digit is twice the second digit.");
    multiplierFound = true;
  } else if (d1 === 2 * d0) {
    pool.push("The second digit is twice the first digit.");
    multiplierFound = true;
  }

  if (d2 === 2 * d3) {
    pool.push("The third digit is twice the fourth digit.");
    multiplierFound = true;
  } else if (d3 === 2 * d2) {
    pool.push("The fourth digit is twice the third digit.");
    multiplierFound = true;
  }

  if (!multiplierFound) {
    if (d0 === 3 * d1) {
      pool.push("The first digit is three times the second digit.");
    } else if (d1 === 3 * d0) {
      pool.push("The second digit is three times the first digit.");
    } else if (d2 === 3 * d3) {
      pool.push("The third digit is three times the fourth digit.");
    } else if (d3 === 3 * d2) {
      pool.push("The fourth digit is three times the third digit.");
    }
  }

  // 4. Differences
  pool.push(
    `The absolute difference between the first and third digit is ${Math.abs(d0 - d2)}.`
  );
  pool.push(
    `The absolute difference between the second and fourth digit is ${Math.abs(d1 - d3)}.`
  );

  // 5. Parity clues
  const evensCount = code.filter((x) => x % 2 === 0).length;
  pool.push(`There are exactly ${evensCount} even digits in the code.`);
  pool.push(
    `The first digit is ${d0 % 2 === 0 ? "even" : "odd"} and the last digit is ${
      d3 % 2 === 0 ? "even" : "odd"
    }.`
  );

  // Shuffle pool to pick random ones
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Get exactly 5 clues
  const clues = pool.slice(0, 5);
  return clues;
};

/**
 * Evaluates a single guess against a secret code.
 */
const evaluateGuess = (secretCode, guess) => {
  let green = 0;
  let yellow = 0;

  const secretRemaining = [];
  const guessRemaining = [];

  for (let i = 0; i < 4; i++) {
    if (guess[i] === secretCode[i]) {
      green += 1;
    } else {
      secretRemaining.push(secretCode[i]);
      guessRemaining.push(guess[i]);
    }
  }

  for (let i = 0; i < guessRemaining.length; i++) {
    const idx = secretRemaining.indexOf(guessRemaining[i]);
    if (idx !== -1) {
      yellow += 1;
      secretRemaining.splice(idx, 1);
    }
  }

  return { green, yellow };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5 MANDATORY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generate(config) - Build all levels server-side at session start.
 */
const generate = (config) => {
  const totalRounds = config?.total_levels || 10;
  const attemptsPerRound = config?.attempts_per_level || 5;
  const timeLimit = config?.time_limit || 120;

  const levels = [];
  for (let i = 0; i < totalRounds; i++) {
    const code = generateSecretCode();
    const allClues = generateClues(code);
    levels.push({
      secretCode: code,
      allClues,
      cluesUnlockedCount: 2, // Start with 2 clues unlocked
      attemptsAllowed: attemptsPerRound,
      timeLimit,
      guesses: [],
      solved: false,
    });
  }

  return { levels };
};

/**
 * redactRound(round) - Strip secret code and hidden clues from a single level.
 */
const redactRound = (round) => {
  if (!round) return round;
  const { secretCode, allClues, cluesUnlockedCount, ...safe } = round;
  // Expose only the unlocked clues
  safe.clues = (allClues || []).slice(0, cluesUnlockedCount || 2);
  return safe;
};

/**
 * redact(sessionState) - Strip secret codes and hidden clues from ALL levels.
 */
const redact = (sessionState) => {
  if (!sessionState || !sessionState.fullState) return sessionState;
  const levels = sessionState.fullState.levels || sessionState.fullState.rounds;
  if (!levels) return sessionState;
  const redactedItems = levels.map(redactRound);
  return {
    ...sessionState,
    fullState: {
      ...sessionState.fullState,
      [sessionState.fullState.levels ? "levels" : "rounds"]: redactedItems,
    },
  };
};

/**
 * verify(sessionState, clientSubmission, config) - Fallback/offline evaluation.
 */
const verify = (sessionState, _clientSubmission, config) => {
  const fullState = sessionState?.fullState || sessionState;
  const pointsPerCorrect = config?.points_per_correct || 25;
  const penaltyPerWrong = config?.penalty_per_wrong || 3;

  const levels = fullState?.levels || fullState?.rounds || [];
  let score = 0;
  let mistakes = 0;
  let skips = 0;

  levels.forEach((round) => {
    if (round.solved) {
      const guessesUsed = round.guesses.length;
      const bonus = Math.max(
        0,
        (round.attemptsAllowed - guessesUsed) * penaltyPerWrong
      );
      score += pointsPerCorrect + bonus;
    }
  });

  return { score, mistakes, skips };
};

/**
 * verifyTurn(sessionState, answer, config) - Core turn evaluation.
 */
const verifyTurn = (sessionState, answer, config) => {
  const fullState = sessionState.fullState;
  const levels = fullState.levels || fullState.rounds;
  const currentIndex = sessionState.currentIndex;

  const pointsPerCorrect = config?.points_per_correct || 25;
  const penaltyPerWrong = config?.penalty_per_wrong || 3;
  const maxMistakes = config?.max_mistakes || 3;
  const maxSkips = config?.max_skips || 3;

  const currentRound = levels[currentIndex];
  if (!currentRound) {
    throw new Error("No active level found at index: " + currentIndex);
  }

  const secretCode = currentRound.secretCode;
  const attemptsAllowed = currentRound.attemptsAllowed;

  const isSkip = answer?.action === "skip";
  const guess = isSkip ? null : answer?.guess;

  if (!isSkip && (!Array.isArray(guess) || guess.length !== 4)) {
    throw new Error("Invalid guess: must be an array of 4 digits");
  }

  let green = 0;
  let yellow = 0;
  let roundSolved = false;
  let skipped = false;
  let roundCompleted = false;

  let nextScore = sessionState.score || 0;
  let nextMistakes = sessionState.mistakes || 0;
  let nextSkips = sessionState.skips || 0;

  let updatedGuesses = [...(currentRound.guesses || [])];
  let nextCluesUnlocked = currentRound.cluesUnlockedCount || 2;

  if (isSkip) {
    skipped = true;
    nextSkips += 1;
    roundCompleted = true;
  } else {
    const result = evaluateGuess(secretCode, guess);
    green = result.green;
    yellow = result.yellow;
    roundSolved = green === 4;

    updatedGuesses = [...updatedGuesses, { guess, green, yellow }];
    const guessesUsed = updatedGuesses.length;

    if (roundSolved) {
      const guessesSaved = attemptsAllowed - guessesUsed;
      const bonus = guessesSaved * penaltyPerWrong;
      nextScore += pointsPerCorrect + bonus;
      roundCompleted = true;
    } else {
      // Wrong guess: unlock next clue if available (max clues pool = 5)
      if (nextCluesUnlocked < 5) {
        nextCluesUnlocked += 1;
      }

      if (guessesUsed >= attemptsAllowed) {
        nextMistakes += 1;
        roundCompleted = true;
      }
    }
  }

  // Update level details in fullState
  levels[currentIndex] = {
    ...currentRound,
    guesses: updatedGuesses,
    cluesUnlockedCount: nextCluesUnlocked,
    solved: roundSolved,
  };

  const gameOverByMistakes = nextMistakes >= maxMistakes;
  const gameOverBySkips = nextSkips >= maxSkips;
  const noMoreRounds = currentIndex + 1 >= levels.length;

  const completed =
    roundCompleted && (gameOverByMistakes || gameOverBySkips || noMoreRounds);

  let nextRound = null;
  if (roundCompleted && !completed) {
    const nr = levels[currentIndex + 1];
    nextRound = redactRound(nr);
  }

  return {
    isCorrect: roundSolved,
    correctAnswer: roundCompleted ? secretCode : null,
    green,
    yellow,
    guess,
    guessesUsed: updatedGuesses.length,
    attemptsAllowed,
    roundSolved,
    skipped,
    nextScore,
    nextMistakes,
    nextSkips,
    roundCompleted,
    completed,
    nextRound,
    clues: currentRound.allClues.slice(0, nextCluesUnlocked),
  };
};

export default {
  generate,
  redact,
  redactRound,
  redactLevel: redactRound,
  verify,
  verifyTurn,
};
