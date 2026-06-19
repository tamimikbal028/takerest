/**
 * Logical Deduction (Codebreaker / Mastermind) – Multi-Round Game Logic
 *
 * Structure: Multiple rounds, each with a fresh secret 4-digit code.
 * Each round has a limited number of guesses (attempts_per_round).
 * Failing to crack a code in the allowed guesses = Mistake.
 * Skipping a round = Skip.
 * 3 mistakes OR 3 skips → Game Over.
 *
 * Feedback per guess:
 *   - green:  digit correct AND in the correct position
 *   - yellow: digit is in the code but in the WRONG position
 */

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
 * Evaluates a single guess against a secret code.
 * @param {number[]} secretCode
 * @param {number[]} guess
 * @returns {{ green: number, yellow: number }}
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
 * generate(config) – Build all rounds server-side at session start.
 * generate(config) – Build all levels server-side at session start.
 *
 * Each level:
 *   { secretCode, attemptsAllowed, guesses: [], solved: false }
 *
 * config fields (from public.games.content_config):
 *   total_levels       : number of codes to crack  (default 10)
 *   attempts_per_level : guesses allowed per code  (default 10)
 *   max_skips          : skip limit                (default 3)
 *   max_mistakes       : mistake limit             (default 3)
 *   points_per_correct : base score per solved code (default 20)
 *   penalty_per_wrong  : deduction per guess used  (default 2)
 */
const generate = (config) => {
  const totalRounds = config?.total_levels || config?.total_rounds || 10;
  const attemptsPerRound = config?.attempts_per_level || config?.attempts_per_round || 10;
  const timeLimit = config?.time_limit || 100;

  const levels = [];
  for (let i = 0; i < totalRounds; i++) {
    levels.push({
      secretCode: generateSecretCode(),   // hidden – never sent to client
      attemptsAllowed: attemptsPerRound,
      timeLimit,
      guesses: [],                        // list of { guess, green, yellow }
      solved: false,
    });
  }

  return { levels };
};

/**
 * redactRound(round) – Strip secret code from a single level before sending to client.
 */
const redactRound = (round) => {
  if (!round) return round;
  const { secretCode, ...safe } = round;
  return safe;
};

/**
 * redact(sessionState) – Strip secret codes from ALL levels in the session state.
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
 * verify(sessionState, clientSubmission, config) – Offline / fallback evaluation.
 * Aggregates score across all levels already played.
 */
const verify = (sessionState, _clientSubmission, config) => {
  const fullState = sessionState?.fullState || sessionState;
  const pointsPerCorrect = config?.points_per_correct || 20;
  const penaltyPerWrong = config?.penalty_per_wrong || 2;

  const levels = fullState?.levels || fullState?.rounds || [];
  let score = 0;
  let mistakes = 0;
  let skips = 0;

  levels.forEach((round) => {
    if (round.solved) {
      const guessesUsed = round.guesses.length;
      const bonus = Math.max(0, (round.attemptsAllowed - guessesUsed) * penaltyPerWrong);
      score += pointsPerCorrect + bonus;
    }
  });

  return { score, mistakes, skips };
};

/**
 * verifyTurn(sessionState, answer, config) – Core turn-by-turn evaluation.
 *
 * Two modes driven by `answer.action`:
 *   - { action: "guess", guess: number[] }  → evaluate a guess for the current level
 *   - { action: "skip" }                    → forfeit the current level
 *
 * A level ends when:
 *   - Player guesses correctly (solved = true)
 *   - Player exhausts attemptsAllowed without solving → Mistake
 *   - Player skips → Skip
 */
const verifyTurn = (sessionState, answer, config) => {
  const fullState = sessionState.fullState;
  const levels = fullState.levels || fullState.rounds;
  const currentIndex = sessionState.currentIndex;

  const pointsPerCorrect = config?.points_per_correct || 20;
  const penaltyPerWrong = config?.penalty_per_wrong || 2;
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

  // ── Evaluate ──────────────────────────────────────────────────────────────
  let green = 0;
  let yellow = 0;
  let roundSolved = false;
  let skipped = false;
  let roundCompleted = false;

  let nextScore = sessionState.score || 0;
  let nextMistakes = sessionState.mistakes || 0;
  let nextSkips = sessionState.skips || 0;

  let updatedGuesses = [...(currentRound.guesses || [])];

  if (isSkip) {
    // Forfeit this level
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
      // Score: base + bonus for guesses saved
      const guessesSaved = attemptsAllowed - guessesUsed;
      const bonus = guessesSaved * penaltyPerWrong;
      nextScore += pointsPerCorrect + bonus;
      roundCompleted = true;
    } else if (guessesUsed >= attemptsAllowed) {
      // Exhausted all attempts without solving → Mistake
      nextMistakes += 1;
      roundCompleted = true;
    }
  }

  // Persist back into fullState
  levels[currentIndex] = {
    ...currentRound,
    guesses: updatedGuesses,
    solved: roundSolved,
  };

  // ── Check overall game completion ─────────────────────────────────────────
  const gameOverByMistakes = nextMistakes >= maxMistakes;
  const gameOverBySkips = nextSkips >= maxSkips;
  const noMoreRounds = currentIndex + 1 >= levels.length;

  const completed =
    roundCompleted &&
    (gameOverByMistakes || gameOverBySkips || noMoreRounds);

  // ── Prepare next level payload ────────────────────────
  let nextRound = null;
  if (roundCompleted && !completed) {
    const nr = levels[currentIndex + 1];
    nextRound = redactRound(nr);
  }

  return {
    isCorrect: roundSolved,
    correctAnswer: roundCompleted ? secretCode : null, // reveal when round ends
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
