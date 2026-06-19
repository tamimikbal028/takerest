const ops = ["+", "-", "*"];

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Safely evaluates a token array containing string integers, operators (+, -, *), and parentheses.
 * Implements the Shunting-yard algorithm for operator precedence (* before + and -) and parentheses grouping.
 * Returns null if the expression is syntactically invalid.
 */
const evaluateTokens = (tokens) => {
  if (!tokens || tokens.length === 0) return null;
  const cleanTokens = tokens.filter((t) => t !== "");

  const outputQueue = [];
  const operatorStack = [];

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
  };

  const isNumber = (token) => {
    const num = parseInt(token, 10);
    return !isNaN(num) && Number.isInteger(num);
  };

  for (const token of cleanTokens) {
    if (isNumber(token)) {
      outputQueue.push(parseInt(token, 10));
    } else if (token === "+" || token === "-" || token === "*") {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "(" &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token === "(") {
      operatorStack.push(token);
    } else if (token === ")") {
      let hasMatchingOpening = false;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top === "(") {
          hasMatchingOpening = true;
          operatorStack.pop();
          break;
        } else {
          outputQueue.push(operatorStack.pop());
        }
      }
      if (!hasMatchingOpening) return null; // Mismatched parentheses
    } else {
      return null; // Invalid token
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack[operatorStack.length - 1];
    if (top === "(" || top === ")") return null; // Mismatched parentheses
    outputQueue.push(operatorStack.pop());
  }

  // Now evaluate RPN (Reverse Polish Notation)
  const evalStack = [];
  for (const token of outputQueue) {
    if (typeof token === "number") {
      evalStack.push(token);
    } else {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop();
      const a = evalStack.pop();
      let res;
      if (token === "+") res = a + b;
      else if (token === "-") res = a - b;
      else if (token === "*") res = a * b;
      else return null;
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) return null;
  return evalStack[0];
};

/**
 * Generates dynamic math equation rounds based on difficulty config.
 */
const generateRound = (difficulty) => {
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    let tokens = [];
    let exprCards = [];
    let noiseCards = [];

    if (difficulty === "easy") {
      // 2 numbers, 1 operator
      const num1 = Math.floor(Math.random() * 12) + 1;
      const num2 = Math.floor(Math.random() * 12) + 1;
      const op = ops[Math.floor(Math.random() * ops.length)];
      tokens = [num1.toString(), op, num2.toString()];
      exprCards = [...tokens];

      // Add 2 noise cards (1 number, 1 operator)
      const noiseNum = Math.floor(Math.random() * 12) + 1;
      const noiseOp = ops.filter((o) => o !== op)[
        Math.floor(Math.random() * 2)
      ];
      noiseCards = [noiseNum.toString(), noiseOp];
    } else if (difficulty === "medium") {
      // 3 numbers, 2 operators
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const num3 = Math.floor(Math.random() * 10) + 1;
      const op1 = ops[Math.floor(Math.random() * ops.length)];
      const op2 = ops[Math.floor(Math.random() * ops.length)];
      tokens = [num1.toString(), op1, num2.toString(), op2, num3.toString()];
      exprCards = [...tokens];

      // Add 2 noise cards
      const noiseNum = Math.floor(Math.random() * 10) + 1;
      const noiseOp = ops[Math.floor(Math.random() * ops.length)];
      noiseCards = [noiseNum.toString(), noiseOp];
    } else {
      // Hard: 4 numbers, 3 operators
      const num1 = Math.floor(Math.random() * 8) + 1;
      const num2 = Math.floor(Math.random() * 8) + 1;
      const num3 = Math.floor(Math.random() * 8) + 1;
      const num4 = Math.floor(Math.random() * 8) + 1;
      const op1 = ops[Math.floor(Math.random() * ops.length)];
      const op2 = ops[Math.floor(Math.random() * ops.length)];
      const op3 = ops[Math.floor(Math.random() * ops.length)];
      tokens = [
        num1.toString(),
        op1,
        num2.toString(),
        op2,
        num3.toString(),
        op3,
        num4.toString(),
      ];
      exprCards = [...tokens];

      // Add 2 noise cards
      const noiseNum = Math.floor(Math.random() * 8) + 1;
      const noiseOp = ops[Math.floor(Math.random() * ops.length)];
      noiseCards = [noiseNum.toString(), noiseOp];
    }

    const target = evaluateTokens(tokens);

    // Keep only clean positive integer targets
    if (target !== null && target > 0) {
      const numberCards = [...exprCards, ...noiseCards].filter((t) => {
        const num = parseInt(t, 10);
        return !isNaN(num);
      });
      const cards = shuffle(numberCards);
      const timeLimit =
        difficulty === "easy" ? 15 : difficulty === "medium" ? 25 : 35;

      return {
        target,
        cards,
        correctExpression: tokens.join(" "),
        timeLimit,
      };
    }
  }

  // Fallback if loop runs out of attempts
  return {
    target: 10,
    cards: ["5", "5", "2"],
    correctExpression: "5 + 5",
    timeLimit: 15,
  };
};

/**
 * Generates game session rounds
 */
const generate = (config) => {
  const easyRoundsCount = config.easy_levels || config.easy_rounds || 5;
  const mediumRoundsCount = config.medium_levels || config.medium_rounds || 5;
  const hardRoundsCount = config.hard_levels || config.hard_rounds || 5;

  const levels = [];

  for (let i = 0; i < easyRoundsCount; i++) {
    levels.push(generateRound("easy"));
  }
  for (let i = 0; i < mediumRoundsCount; i++) {
    levels.push(generateRound("medium"));
  }
  for (let i = 0; i < hardRoundsCount; i++) {
    levels.push(generateRound("hard"));
  }

  return {
    levels,
  };
};

const redactRound = (round) => {
  if (!round) return round;
  const { correctExpression, ...rest } = round;
  return rest;
};

/**
 * Redacts answers before sending sessionState to client
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
 * Verifies offline full submission (fallback)
 */
const verify = (sessionState, clientSubmission, config) => {
  const { answers } = clientSubmission;
  const submissions = answers || [];
  const levels = sessionState.levels || sessionState.rounds || [];

  const pointsPerCorrect = config.points_per_correct || 10;
  const penaltyPerWrong = config.penalty_per_wrong || 5;
  const maxMistakes = config.max_mistakes || 3;
  const maxSkips = config.max_skips || 3;

  let score = 0;
  let mistakes = 0;
  let skips = 0;

  const totalRoundsEvaluated = Math.min(levels.length, submissions.length);

  for (let i = 0; i < totalRoundsEvaluated; i++) {
    const round = levels[i];
    const userTokens = submissions[i]; // Array of string tokens

    if (
      userTokens === null ||
      userTokens === undefined ||
      userTokens.length === 0
    ) {
      skips += 1;
      if (skips >= maxSkips) {
        break;
      }
    } else {
      // 1. Verify user tokens are a valid subset of round cards (only check numbers)
      const allowedOperators = ["+", "-", "*", "(", ")"];
      const availableNumbers = [...round.cards];
      let isValidSubset = true;
      for (const t of userTokens) {
        if (allowedOperators.includes(t)) {
          continue;
        }
        const idx = availableNumbers.indexOf(t);
        if (idx === -1) {
          isValidSubset = false;
          break;
        }
        availableNumbers.splice(idx, 1);
      }

      // 2. Evaluate tokens
      const val = isValidSubset ? evaluateTokens(userTokens) : null;

      if (val !== null && val === round.target) {
        score += pointsPerCorrect;
      } else {
        score -= penaltyPerWrong;
        mistakes += 1;
        if (mistakes >= maxMistakes) {
          break;
        }
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

/**
 * Verifies turn-by-turn submission
 */
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

  const userTokens = answer; // expected to be an array of string tokens e.g. ['5', '+', '5']

  if (
    userTokens === null ||
    userTokens === undefined ||
    userTokens.length === 0
  ) {
    skipped = true;
    nextSkips += 1;
  } else {
    // 1. Verify subset validity (only check numbers, operators are unlimited)
    const allowedOperators = ["+", "-", "*", "(", ")"];
    const availableNumbers = [...round.cards];
    let isValidSubset = true;
    for (const t of userTokens) {
      if (allowedOperators.includes(t)) {
        continue;
      }
      const idx = availableNumbers.indexOf(t);
      if (idx === -1) {
        isValidSubset = false;
        break;
      }
      availableNumbers.splice(idx, 1);
    }

    // 2. Evaluate expression
    const val = isValidSubset ? evaluateTokens(userTokens) : null;

    if (val !== null && val === round.target) {
      isCorrect = true;
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
    correctAnswer: round.correctExpression,
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
