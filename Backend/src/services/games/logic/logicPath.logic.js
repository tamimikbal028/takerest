/**
 * Logic Path – Programming / Sequencing Game Logic
 *
 * Structure: Multiple rounds, each with a grid of cells.
 * Player inputs a sequence of movements (up, down, left, right) to reach the end cell.
 * Easy rounds: 4x4 grid, obstacles, direct path.
 * Medium rounds: 5x5 grid, obstacles, key must be collected before entering the locked goal.
 * Hard rounds: 6x6 grid, obstacles, key, and portals (teleporters).
 */

const solveLogicPath = (gridSize, start, end, obstacles, key, portals) => {
  const isObstacle = (x, y) =>
    obstacles.some(([ox, oy]) => ox === x && oy === y);

  // Queue stores: [x, y, hasKey, path]
  const queue = [[start[0], start[1], key ? false : true, []]];
  const visited = new Set();
  visited.add(`${start[0]},${start[1]},${key ? "false" : "true"}`);

  while (queue.length > 0) {
    const [x, y, hasKey, path] = queue.shift();

    if (x === end[0] && y === end[1] && hasKey) {
      return path;
    }

    const directions = [
      { name: "up", dx: -1, dy: 0 },
      { name: "down", dx: 1, dy: 0 },
      { name: "left", dx: 0, dy: -1 },
      { name: "right", dx: 0, dy: 1 },
    ];

    for (const { name, dx, dy } of directions) {
      let nx = x + dx;
      let ny = y + dy;

      // check boundaries
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
      // check obstacle
      if (isObstacle(nx, ny)) continue;

      // check portal entrance
      if (portals && nx === portals[0][0] && ny === portals[0][1]) {
        nx = portals[1][0];
        ny = portals[1][1];
      }

      // check key
      let nextHasKey = hasKey;
      if (key && nx === key[0] && ny === key[1]) {
        nextHasKey = true;
      }

      // check locked end cell
      if (nx === end[0] && ny === end[1] && !nextHasKey) {
        continue; // cannot enter locked end cell without key
      }

      const stateKey = `${nx},${ny},${nextHasKey}`;
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push([nx, ny, nextHasKey, [...path, name]]);
      }
    }
  }

  return null; // unsolvable
};

const generateRound = (options) => {
  const gridSize = options.gridSize || 4;
  const obstaclesCount =
    options.obstaclesCount !== undefined ? options.obstaclesCount : 2;
  const hasKey = !!options.hasKey;
  const hasPortal = !!options.hasPortal;
  const timeLimit = options.timeLimit || 30;
  const minPathLength = options.minPathLength || 4;

  const start = [0, 0];
  const end = [gridSize - 1, gridSize - 1];

  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const obstacles = [];
    const allCells = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // avoid start and end
        if (
          (r === start[0] && c === start[1]) ||
          (r === end[0] && c === end[1])
        )
          continue;
        allCells.push([r, c]);
      }
    }

    // shuffle allCells
    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    let cellIndex = 0;

    // Pick obstacles
    for (let i = 0; i < obstaclesCount; i++) {
      if (cellIndex >= allCells.length) break;
      obstacles.push(allCells[cellIndex++]);
    }

    // Pick key
    let key = null;
    if (hasKey) {
      if (cellIndex >= allCells.length) continue;
      key = allCells[cellIndex++];
    }

    // Pick portal
    let portals = null;
    if (hasPortal) {
      if (cellIndex + 1 >= allCells.length) continue;
      portals = [
        allCells[cellIndex++], // entrance
        allCells[cellIndex++], // exit
      ];
    }

    // Solve
    const path = solveLogicPath(gridSize, start, end, obstacles, key, portals);
    if (path && path.length >= minPathLength) {
      // Valid board
      let buffer = 0;
      if (gridSize === 4) buffer = 2;
      else if (gridSize === 5) buffer = 1;

      const commandsLimit = path.length + buffer;
      return {
        gridSize,
        start,
        end,
        obstacles,
        key,
        portals,
        commandsLimit,
        timeLimit,
        shortestPath: path,
      };
    }
  }

  // fallback simple round
  return {
    gridSize,
    start,
    end,
    obstacles: [],
    key: hasKey ? [0, gridSize - 1] : null,
    portals: null,
    commandsLimit: gridSize * 2,
    timeLimit,
    shortestPath: [],
  };
};

/**
 * generate(config) – Generate rounds for a game session
 * 10 levels sequence:
 * - Level 1: Normal simple (4x4, 2 obstacles, no key, no portal)
 * - Level 2: Simple Key (4x4, 3 obstacles, key, no portal)
 * - Level 3: Medium Key (5x5, 3 obstacles, key, no portal)
 * - Level 4: Simple Portal (5x5, 3 obstacles, no key, portal)
 * - Level 5: Portal + Key (5x5, 4 obstacles, key, portal)
 * - Level 6: Hard (6x6, 5 obstacles, key, portal)
 * - Level 7: Harder (6x6, 6 obstacles, key, portal, longer min path)
 * - Level 8: Extreme (6x6, 7 obstacles, key, portal, longer min path)
 * - Level 9: Master (6x6, 8 obstacles, key, portal, longer min path)
 * - Level 10: Grandmaster (6x6, 9 obstacles, key, portal, longer min path)
 */
const generate = (config) => {
  const levelsOptions = [
    // Level 1: Simple grid
    {
      gridSize: 4,
      obstaclesCount: 2,
      hasKey: false,
      hasPortal: false,
      minPathLength: 4,
      timeLimit: 30,
    },
    // Level 2: Key added
    {
      gridSize: 4,
      obstaclesCount: 3,
      hasKey: true,
      hasPortal: false,
      minPathLength: 5,
      timeLimit: 40,
    },
    // Level 3: Medium grid + Key
    {
      gridSize: 5,
      obstaclesCount: 3,
      hasKey: true,
      hasPortal: false,
      minPathLength: 6,
      timeLimit: 45,
    },
    // Level 4: Portal added (no key)
    {
      gridSize: 5,
      obstaclesCount: 3,
      hasKey: false,
      hasPortal: true,
      minPathLength: 6,
      timeLimit: 45,
    },
    // Level 5: Portal + Key
    {
      gridSize: 5,
      obstaclesCount: 4,
      hasKey: true,
      hasPortal: true,
      minPathLength: 7,
      timeLimit: 55,
    },
    // Level 6: Hard 6x6
    {
      gridSize: 6,
      obstaclesCount: 5,
      hasKey: true,
      hasPortal: true,
      minPathLength: 8,
      timeLimit: 60,
    },
    // Level 7: Harder 6x6
    {
      gridSize: 6,
      obstaclesCount: 6,
      hasKey: true,
      hasPortal: true,
      minPathLength: 9,
      timeLimit: 60,
    },
    // Level 8: Extreme
    {
      gridSize: 6,
      obstaclesCount: 7,
      hasKey: true,
      hasPortal: true,
      minPathLength: 10,
      timeLimit: 75,
    },
    // Level 9: Master
    {
      gridSize: 6,
      obstaclesCount: 8,
      hasKey: true,
      hasPortal: true,
      minPathLength: 11,
      timeLimit: 90,
    },
    // Level 10: Grandmaster
    {
      gridSize: 6,
      obstaclesCount: 9,
      hasKey: true,
      hasPortal: true,
      minPathLength: 12,
      timeLimit: 100,
    },
  ];

  const totalRounds = config?.total_levels || config?.total_rounds || 10;
  const levels = [];

  for (let i = 0; i < totalRounds; i++) {
    const option = levelsOptions[Math.min(i, levelsOptions.length - 1)];
    levels.push(generateRound(option));
  }

  return { levels };
};

const redactRound = (round) => {
  if (!round) return round;
  const { shortestPath, ...rest } = round;
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

/**
 * verifyRun(round, commands)
 * Simulates a sequence of movements.
 * Returns: { success: boolean, pathTaken: Array<[number, number]>, reason?: string }
 */
const simulatePath = (round, commands) => {
  const { gridSize, start, end, obstacles, key, portals, commandsLimit } =
    round;

  if (!Array.isArray(commands)) {
    return {
      success: false,
      pathTaken: [start],
      reason: "Invalid commands payload",
    };
  }

  if (commands.length > commandsLimit) {
    return { success: false, pathTaken: [start], reason: "Too many commands" };
  }

  const isObstacle = (x, y) =>
    obstacles.some(([ox, oy]) => ox === x && oy === y);

  let x = start[0];
  let y = start[1];
  let hasKey = key ? false : true;
  const pathTaken = [[x, y]];

  for (const dir of commands) {
    let dx = 0,
      dy = 0;
    if (dir === "up") dx = -1;
    else if (dir === "down") dx = 1;
    else if (dir === "left") dy = -1;
    else if (dir === "right") dy = 1;
    else {
      return { success: false, pathTaken, reason: `Invalid command: ${dir}` };
    }

    let nx = x + dx;
    let ny = y + dy;

    // Boundary check
    if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
      return { success: false, pathTaken, reason: "Out of bounds" };
    }

    // Obstacle check
    if (isObstacle(nx, ny)) {
      pathTaken.push([nx, ny]);
      return { success: false, pathTaken, reason: "Hit an obstacle" };
    }

    // Portal entrance check
    if (portals && nx === portals[0][0] && ny === portals[0][1]) {
      // First move into portal entrance, then instantly teleport to exit
      pathTaken.push([nx, ny]);
      nx = portals[1][0];
      ny = portals[1][1];
    }

    // Key collection
    if (key && nx === key[0] && ny === key[1]) {
      hasKey = true;
    }

    // Lock check on end cell
    if (nx === end[0] && ny === end[1] && !hasKey) {
      pathTaken.push([nx, ny]);
      return {
        success: false,
        pathTaken,
        reason: "Goal is locked! Collect the key first.",
      };
    }

    x = nx;
    y = ny;
    pathTaken.push([x, y]);
  }

  const reachedGoal = x === end[0] && y === end[1];
  if (reachedGoal && hasKey) {
    return { success: true, pathTaken };
  }

  return {
    success: false,
    pathTaken,
    reason: reachedGoal
      ? "Goal reached, but locked!"
      : "Did not reach destination",
  };
};

/**
 * verify(sessionState, clientSubmission, config)
 */
const verify = (sessionState, clientSubmission, config) => {
  const { answers } = clientSubmission;
  const submissions = answers || clientSubmission.selections || [];
  const levels = sessionState.levels || sessionState.rounds || [];

  const pointsPerCorrect = config?.points_per_correct || 20;
  const penaltyPerWrong = config?.penalty_per_wrong || 5;
  const maxMistakes = config?.max_mistakes || 3;
  const maxSkips = config?.max_skips || 3;

  let score = 0;
  let mistakes = 0;
  let skips = 0;

  const totalRoundsEvaluated = Math.min(levels.length, submissions.length);
  for (let i = 0; i < totalRoundsEvaluated; i++) {
    const round = levels[i];
    const userPath = submissions[i];

    if (userPath === null || userPath === undefined) {
      skips += 1;
      if (skips >= maxSkips) break;
    } else {
      const simulation = simulatePath(round, userPath);
      if (simulation.success) {
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

/**
 * verifyTurn(sessionState, answer, config)
 */
const verifyTurn = (sessionState, answer, config) => {
  const currentIndex = sessionState.currentIndex;
  const levels = sessionState.fullState.levels || sessionState.fullState.rounds || [];
  const round = levels[currentIndex];

  const pointsPerCorrect = config?.points_per_correct || 20;
  const penaltyPerWrong = config?.penalty_per_wrong || 5;
  const maxMistakes = config?.max_mistakes || 3;
  const maxSkips = config?.max_skips || 3;

  let isCorrect = false;
  let skipped = false;

  let nextScore = sessionState.score || 0;
  let nextMistakes = sessionState.mistakes || 0;
  let nextSkips = sessionState.skips || 0;

  let simulation = null;

  if (answer === null || answer === undefined) {
    skipped = true;
    nextSkips += 1;
  } else {
    simulation = simulatePath(round, answer);
    if (simulation.success) {
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
    correctAnswer: round.shortestPath, // reveal shortest path on round completion/turn submission
    nextScore,
    nextMistakes,
    nextSkips,
    completed,
    simulation, // send simulation data (pathTaken, success, reason) to frontend for rendering animation
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
