const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (items) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [list[i], list[swapIndex]] = [list[swapIndex], list[i]];
  }
  return list;
};

const createOptions = (answer, range = 12) => {
  const wrongAnswers = new Set();
  while (wrongAnswers.size < 3) {
    const offset = randomBetween(-range, range) || 3;
    const value = Math.max(answer + offset, 0);
    if (value !== answer) {
      wrongAnswers.add(value);
    }
  }
  return shuffle([answer, ...wrongAnswers]);
};

const createQuestion = (level) => {
  // --- LEVEL 1: ax + b = c ---
  if (level === 1) {
    const a = randomBetween(2, 8);
    const x = randomBetween(2, 12);
    const b = randomBetween(1, 25);
    const c = a * x + b;

    return {
      prompt: `${a}x + ${b} = ${c}`,
      answer: x,
      options: createOptions(x, 10),
      timeLimit: 10,
    };
  }

  // --- LEVEL 2: ax + b = cx + d ---
  if (level === 2) {
    const x = randomBetween(2, 10);
    const a = randomBetween(6, 12);
    const c = randomBetween(2, 5);
    const b = randomBetween(1, 15);
    const d = (a - c) * x + b;

    return {
      prompt: `${a}x + ${b} = ${c}x + ${d}`,
      answer: x,
      options: createOptions(x, 8),
      timeLimit: 12,
    };
  }

  // --- LEVEL 3: (ax + b) / c = d ---
  if (level === 3) {
    const x = randomBetween(3, 12);
    const a = randomBetween(2, 6);
    const c = randomBetween(2, 4);
    const rhs = randomBetween(5, 15);
    const b = rhs * c - a * x;

    return {
      prompt: `(${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}) / ${c} = ${rhs}`,
      answer: x,
      options: createOptions(x, 6),
      timeLimit: 15,
    };
  }

  // --- LEVEL 4: √(ax + b) = c ---
  if (level === 4) {
    const c = randomBetween(5, 12);
    const cSquared = c * c;
    const a = randomBetween(2, 8);
    const bBase = randomBetween(1, 30);
    const b = bBase - (bBase % a) + (cSquared % a);
    const x = (cSquared - b) / a;

    return {
      prompt: `√(${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}) = ${c}`,
      answer: x,
      options: createOptions(x, 8),
      timeLimit: 20,
    };
  }

  // --- LEVEL 5: x² + bx + c = 0 (Find positive root) ---
  const r1 = randomBetween(2, 10);
  const r2 = randomBetween(1, 5);
  const b_coeff = r2 - r1;
  const c_const = -(r1 * r2);

  return {
    prompt: `x² ${b_coeff >= 0 ? "+" : "-"} ${Math.abs(b_coeff)}x ${c_const >= 0 ? "+" : "-"} ${Math.abs(c_const)} = 0`,
    answer: r1,
    options: createOptions(r1, 5),
    timeLimit: 25,
  };
};

/**
 * Generates the game session questions
 * @param {Object} config - Config from database public.games.content_config
 */
const generate = (config) => {
  const levels = config.levels || 5;
  const questionsPerLevel = config.questions_per_level || 5;
  const questions = [];

  for (let lvl = 1; lvl <= levels; lvl++) {
    for (let i = 0; i < questionsPerLevel; i++) {
      questions.push(createQuestion(lvl));
    }
  }

  return {
    questions,
  };
};

const redactQuestion = (question) => {
  if (!question) return question;
  const { answer, ...rest } = question;
  return rest;
};

/**
 * Removes the correct answers from sessionState before sending to the client.
 */
const redact = (sessionState) => {
  if (!sessionState || !sessionState.questions) return sessionState;
  return {
    ...sessionState,
    questions: sessionState.questions.map(redactQuestion),
  };
};

/**
 * Evaluates the client's answers against the database session state
 */
const verify = (sessionState, clientSubmission, config) => {
  const { answers } = clientSubmission;
  const questions = sessionState.questions;
  
  const pointsPerCorrect = config.points_per_correct || 10;
  const penaltyPerWrong = config.penalty_per_wrong || 5;
  const maxMistakes = config.max_mistakes || 3;
  const maxSkips = config.max_skips || 3;

  let score = 0;
  let mistakes = 0;
  let skips = 0;
  
  const totalQuestionsEvaluated = Math.min(questions.length, answers.length);

  for (let i = 0; i < totalQuestionsEvaluated; i++) {
    const question = questions[i];
    const clientAnswer = answers[i];

    if (clientAnswer === null || clientAnswer === undefined) {
      // Skipped question / timed out
      skips += 1;
      if (skips >= maxSkips) {
        break; // Early finish due to skips
      }
    } else if (clientAnswer === question.answer) {
      // Correct answer
      score += pointsPerCorrect;
    } else {
      // Wrong answer
      score -= penaltyPerWrong;
      mistakes += 1;
      if (mistakes >= maxMistakes) {
        break; // Early finish due to mistakes
      }
    }
  }

  // Ensure score doesn't fall below zero
  const finalScore = Math.max(0, score);

  return {
    score: finalScore,
    mistakes,
    skips,
  };
};

const verifyTurn = (sessionState, answer, config) => {
  const currentIndex = sessionState.currentIndex;
  const question = sessionState.fullState.questions[currentIndex];
  
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
  } else if (answer === question.answer) {
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
    currentIndex + 1 >= sessionState.fullState.questions.length;

  return {
    isCorrect,
    correctAnswer: question.answer,
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
  redactQuestion,
};
