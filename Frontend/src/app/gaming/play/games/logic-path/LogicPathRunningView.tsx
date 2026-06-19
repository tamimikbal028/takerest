import { useState, useEffect, useRef, useCallback } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type {
  LogicPathRound,
  Direction,
  LogicPathTurnResponse,
} from "./logicPath.types";
import gamingHooks from "@/hooks/useGaming";
import {
  FaRobot,
  FaKey,
  FaLock,
  FaTrophy,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";

interface LogicPathRunningViewProps {
  sessionId: string;
  firstRound: LogicPathRound;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const LogicPathRunningView = ({
  sessionId,
  firstRound,
  totalQuestions,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: LogicPathRunningViewProps) => {
  const [currentRound, setCurrentRound] = useState<LogicPathRound>(firstRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstRound?.timeLimit || 30);

  // Command queue built by the user
  const [commandQueue, setCommandQueue] = useState<Direction[]>([]);

  // Simulation/Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPath, setAnimationPath] = useState<Array<[number, number]>>(
    []
  );
  const [currentAnimIndex, setCurrentAnimIndex] = useState<number | null>(null);
  const [animationOutcome, setAnimationOutcome] = useState<{
    success: boolean;
    reason?: string;
  } | null>(null);

  const [pendingTransition, setPendingTransition] = useState<{
    completed: boolean;
    nextQuestion?: LogicPathRound;
    activeScore: number;
    localMistakes: number;
    localSkips: number;
  } | null>(null);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  useArcadeAutoScroll();

  const hasSkippedRef = useRef(false);

  useEffect(() => {
    hasSkippedRef.current = false;
  }, [currentIndex]);

  const handleNextTurn = useCallback(
    (
      nextRound: LogicPathRound,
      newScore: number,
      newMistakes: number,
      newSkips: number
    ) => {
      setCurrentRound(nextRound);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(nextRound?.timeLimit || 30);
      setScore(newScore);
      setMistakes(newMistakes);
      setSkips(newSkips);

      // Reset game board states
      setCommandQueue([]);
      setIsAnimating(false);
      setAnimationPath([]);
      setCurrentAnimIndex(null);
      setAnimationOutcome(null);
    },
    []
  );

  const handleConfirmNext = () => {
    if (!pendingTransition) return;
    const { completed, nextQuestion, activeScore, localMistakes, localSkips } =
      pendingTransition;

    setPendingTransition(null);

    if (completed) {
      onFinish(activeScore);
    } else if (nextQuestion) {
      handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
    }
  };

  const handleTurnResponse = useCallback(
    (
      res: LogicPathTurnResponse,
      localScore: number,
      localMistakes: number,
      localSkips: number
    ) => {
      const { completed, simulation, nextQuestion } = res;
      const serverScore =
        res.score !== undefined ? res.score : res.currentScore;
      const activeScore = serverScore !== undefined ? serverScore : localScore;

      if (simulation) {
        // Run step-by-step movement animation
        setIsAnimating(true);
        setAnimationPath(simulation.pathTaken);
        setCurrentAnimIndex(0);

        let step = 0;
        const totalSteps = simulation.pathTaken.length;

        if (animationTimerRef.current) clearInterval(animationTimerRef.current);

        animationTimerRef.current = setInterval(() => {
          step++;
          if (step < totalSteps) {
            setCurrentAnimIndex(step);
          } else {
            // Animation completed
            clearInterval(animationTimerRef.current!);
            setAnimationOutcome({
              success: simulation.success,
              reason: simulation.reason,
            });

            // Store transition data for Next Button
            setPendingTransition({
              completed,
              nextQuestion,
              activeScore,
              localMistakes,
              localSkips,
            });
          }
        }, 250); // Move every 250ms
      } else {
        // In case of timeout or skip (no simulation)
        if (completed) {
          onFinish(activeScore);
        } else if (nextQuestion) {
          handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
        }
      }
    },
    [onFinish, handleNextTurn]
  );

  const handleTimeOut = useCallback(() => {
    if (submitTurnMutation.isPending || isAnimating) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null, // null triggers a skip/timeout
      },
      {
        onSuccess: (res) => {
          handleTurnResponse(res.data, score, mistakes, nextSkips);
        },
      }
    );
  }, [
    skips,
    score,
    mistakes,
    sessionId,
    submitTurnMutation,
    isAnimating,
    handleTurnResponse,
  ]);

  const handleTimeOutRef = useRef(handleTimeOut);
  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  useEffect(() => {
    setTimeLeft(currentRound.timeLimit);
    endTimeRef.current = Date.now() + currentRound.timeLimit * 1000;
  }, [currentRound]);

  useEffect(() => {
    if (isAnimating) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = (endTimeRef.current - Date.now()) / 1000;
      if (remaining <= 0.1) {
        clearInterval(timerRef.current!);
        setTimeLeft(0);

        if (!hasSkippedRef.current) {
          hasSkippedRef.current = true;
          handleTimeOutRef.current();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, isAnimating]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  const handleAddCommand = (dir: Direction) => {
    if (isAnimating || commandQueue.length >= currentRound.commandsLimit)
      return;
    setCommandQueue((prev) => [...prev, dir]);
  };

  const handleRemoveLastCommand = () => {
    if (isAnimating) return;
    setCommandQueue((prev) => prev.slice(0, -1));
  };

  const handleClearCommands = () => {
    if (isAnimating) return;
    setCommandQueue([]);
  };

  const handleSkip = () => {
    if (submitTurnMutation.isPending || isAnimating) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null, // null stands for skip
      },
      {
        onSuccess: (res) => {
          handleTurnResponse(res.data, score, mistakes, nextSkips);
        },
      }
    );
  };

  const handleSubmit = () => {
    if (
      isAnimating ||
      commandQueue.length === 0 ||
      submitTurnMutation.isPending
    )
      return;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: commandQueue,
      },
      {
        onSuccess: (res) => {
          const isServerCorrect = res.data.isCorrect;
          let newScore = score;
          let nextMistakes = mistakes;

          if (isServerCorrect) {
            newScore += pointsPerCorrect;
          } else {
            newScore -= penaltyPerWrong;
            nextMistakes += 1;
          }

          const clampedScore = Math.max(0, newScore);
          setScore(clampedScore);
          setMistakes(nextMistakes);

          handleTurnResponse(res.data, clampedScore, nextMistakes, skips);
        },
      }
    );
  };

  // Active position for the robot character
  let robotPosition = currentRound.start;
  let robotHasKey = currentRound.key ? false : true;

  if (isAnimating && currentAnimIndex !== null && animationPath.length > 0) {
    const animPos = animationPath[currentAnimIndex];
    robotPosition = animPos;

    // Check if key is collected by the robot during animation steps
    if (currentRound.key) {
      const pathCheckedSoFar = animationPath.slice(0, currentAnimIndex + 1);
      const collected = pathCheckedSoFar.some(
        ([x, y]) => x === currentRound.key![0] && y === currentRound.key![1]
      );
      robotHasKey = collected;
    }
  }

  // --- GRID RENDER UTILS ---
  const gridSize = currentRound.gridSize;

  const renderCellContents = (r: number, c: number) => {
    const isEnd = r === currentRound.end[0] && c === currentRound.end[1];
    const isObstacle = currentRound.obstacles.some(
      ([ox, oy]) => ox === r && oy === c
    );
    const isKey =
      currentRound.key &&
      r === currentRound.key[0] &&
      c === currentRound.key[1];

    const isPortalEntrance =
      currentRound.portals &&
      r === currentRound.portals[0][0] &&
      c === currentRound.portals[0][1];
    const isPortalExit =
      currentRound.portals &&
      r === currentRound.portals[1][0] &&
      c === currentRound.portals[1][1];

    const isRobotOnCell = robotPosition[0] === r && robotPosition[1] === c;

    // 1. Robot on Cell (Highest Priority)
    if (isRobotOnCell) {
      const isCrashedState =
        animationOutcome &&
        !animationOutcome.success &&
        robotPosition[0] === animationPath[animationPath.length - 1][0] &&
        robotPosition[1] === animationPath[animationPath.length - 1][1];

      return (
        <div
          className={`flex h-4/5 w-4/5 items-center justify-center rounded-xl bg-linear-to-br shadow-md transition-all duration-200 ${
            isCrashedState
              ? "from-rose-500 to-red-600 text-white ring-2 ring-red-400"
              : "from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300"
          }`}
        >
          {isCrashedState ? (
            <FaExclamationTriangle className="h-5 w-5" />
          ) : (
            <FaRobot className="h-6 w-6 animate-pulse" />
          )}
        </div>
      );
    }

    // 2. Obstacles
    if (isObstacle) {
      return <div className="h-4/5 w-4/5 rounded-xl bg-black shadow-md" />;
    }

    // 3. Key
    if (isKey && (!robotHasKey || (isAnimating && !robotHasKey))) {
      return (
        <div className="flex h-4/5 w-4/5 animate-pulse items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 shadow-sm">
          <FaKey className="h-5 w-5" />
        </div>
      );
    }

    // 4. Portals
    if (isPortalEntrance) {
      return (
        <div className="relative flex h-4/5 w-4/5 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 shadow-sm">
          <FaSyncAlt className="h-5 w-5 animate-spin duration-3000" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[8px] font-bold text-white shadow-xs">
            IN
          </span>
        </div>
      );
    }

    if (isPortalExit) {
      return (
        <div className="relative flex h-4/5 w-4/5 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm">
          <FaSyncAlt className="h-5 w-5 animate-pulse" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white shadow-xs">
            OUT
          </span>
        </div>
      );
    }

    // 5. End / Goal
    if (isEnd) {
      const isGoalLocked = currentRound.key !== null && !robotHasKey;
      return (
        <div
          className={`flex h-4/5 w-4/5 flex-col items-center justify-center rounded-xl border border-dashed text-xs font-black transition-all ${
            isGoalLocked
              ? "border-rose-300 bg-rose-50 text-rose-500"
              : "border-emerald-300 bg-emerald-50 text-emerald-600"
          }`}
        >
          {isGoalLocked ? (
            <FaLock className="h-5 w-5" />
          ) : (
            <FaTrophy className="h-5 w-5" />
          )}
          <span className="mt-0.5 text-[9px] font-extrabold uppercase">
            {isGoalLocked ? "LOCKED" : "GOAL"}
          </span>
        </div>
      );
    }

    // 7. General empty walkable space
    return null;
  };

  // --- GRID CELLS MATRIX ---
  const gridCells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      gridCells.push({ r, c });
    }
  }

  // Tailwind columns configuration
  const gridColsClass =
    {
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[gridSize] || "grid-cols-4";

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit}
      instruction={`Program the path from START to GOAL (${gridSize}x${gridSize})`}
      leftStats={[
        { label: "Level", value: `${currentIndex + 1}/${totalQuestions}` },
        {
          label: "Skips",
          value: `${skips}/${maxSkips}`,
          color: skips >= maxSkips ? "text-rose-600" : "text-gray-900",
        },
        {
          label: "Crashes",
          value: `${mistakes}/${maxMistakes}`,
          color: mistakes >= maxMistakes ? "text-rose-600" : "text-gray-900",
        },
      ]}
      rightStats={[{ label: "Score", value: score }]}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* LEFT COLUMN: THE GRID BOARD */}
        <div className="flex flex-1 flex-col items-center">
          <div className="relative aspect-square w-full max-w-sm rounded-3xl border-2 border-gray-200 bg-gray-50 p-3 shadow-inner">
            <div className={`grid ${gridColsClass} h-full w-full gap-2`}>
              {gridCells.map(({ r, c }) => {
                const isStart =
                  r === currentRound.start[0] && c === currentRound.start[1];
                const isEnd =
                  r === currentRound.end[0] && c === currentRound.end[1];

                // Check if this cell is part of the animation path to draw the path line (no live preview line)
                let isPathCell = false;
                const pathArray = isAnimating
                  ? animationPath.slice(0, (currentAnimIndex ?? 0) + 1)
                  : [];

                if (pathArray.length > 0) {
                  isPathCell = pathArray.some(
                    ([px, py]) => px === r && py === c
                  );
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`flex aspect-square items-center justify-center rounded-2xl transition-all duration-200 ${
                      isStart
                        ? "border-2 border-blue-500 bg-blue-300"
                        : isEnd
                          ? "border-2 border-emerald-500 bg-emerald-100"
                          : isPathCell
                            ? "border-2 border-blue-300 bg-blue-50"
                            : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    {renderCellContents(r, c)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STATUS NOTIFICATION OVERLAYS */}
          {animationOutcome && (
            <div
              className={`mt-4 w-full max-w-sm rounded-2xl p-4 text-center text-sm font-bold ${
                animationOutcome.success
                  ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                  : "animate-shake border border-rose-200 bg-rose-100 text-rose-800"
              }`}
            >
              {animationOutcome.success
                ? "🎉 Correct! Level Completed!"
                : `❌ Wrong! ${animationOutcome.reason || "Out of bounds / Blocked!"}`}
            </div>
          )}

          {/* COMMANDS LIMIT TRACKER */}
          <div className="mt-3 text-center text-xs font-bold text-gray-500">
            Commands Used:{" "}
            <span
              className={
                commandQueue.length === currentRound.commandsLimit
                  ? "text-rose-600"
                  : "text-blue-600"
              }
            >
              {commandQueue.length}
            </span>{" "}
            / {currentRound.commandsLimit}
          </div>
        </div>

        {/* RIGHT COLUMN: CODE EDITOR COMMAND CONTROLS */}
        <div className="flex w-full flex-col gap-4 md:w-80">
          {/* 1. COMMAND QUEUE BOX (CODE LINE PREVIEW) */}
          <div className="flex min-h-[120px] flex-col rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-inner">
            <span className="mb-2 text-[10px] font-black tracking-wider text-gray-400 uppercase">
              Command Sequence:
            </span>

            {commandQueue.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-xs font-bold text-gray-400 italic">
                Add movements below to build path...
              </div>
            ) : (
              <div className="flex max-h-[140px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                {commandQueue.map((dir, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-extrabold text-gray-700 shadow-xs"
                  >
                    <span className="text-gray-400">#{idx + 1}</span>
                    <span className="capitalize">
                      {dir === "up"
                        ? "↑ Up"
                        : dir === "down"
                          ? "↓ Down"
                          : dir === "left"
                            ? "← Left"
                            : "→ Right"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. PROGRAMMING BOARD KEYS */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">
              Movement Board:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div />
              <button
                type="button"
                disabled={
                  isAnimating ||
                  commandQueue.length >= currentRound.commandsLimit
                }
                onClick={() => handleAddCommand("up")}
                className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white font-extrabold text-gray-800 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40"
              >
                ↑ UP
              </button>
              <div />

              <button
                type="button"
                disabled={
                  isAnimating ||
                  commandQueue.length >= currentRound.commandsLimit
                }
                onClick={() => handleAddCommand("left")}
                className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white font-extrabold text-gray-800 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40"
              >
                ← LEFT
              </button>
              <button
                type="button"
                disabled={
                  isAnimating ||
                  commandQueue.length >= currentRound.commandsLimit
                }
                onClick={() => handleAddCommand("down")}
                className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white font-extrabold text-gray-800 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40"
              >
                ↓ DOWN
              </button>
              <button
                type="button"
                disabled={
                  isAnimating ||
                  commandQueue.length >= currentRound.commandsLimit
                }
                onClick={() => handleAddCommand("right")}
                className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white font-extrabold text-gray-800 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40"
              >
                → RIGHT
              </button>
            </div>
          </div>

          {/* 3. EDIT ACTIONS & SUBMIT */}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isAnimating || commandQueue.length === 0}
                onClick={handleRemoveLastCommand}
                className="flex-1 rounded-xl border border-rose-100 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-[0.98] disabled:opacity-40"
              >
                Backspace
              </button>
              <button
                type="button"
                disabled={isAnimating || commandQueue.length === 0}
                onClick={handleClearCommands}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-600 transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-40"
              >
                Reset Queue
              </button>
            </div>

            {pendingTransition ? (
              <div className="mt-1 flex">
                <button
                  type="button"
                  onClick={handleConfirmNext}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                >
                  {pendingTransition.completed ? "FINISH GAME" : "NEXT LEVEL"}
                </button>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  disabled={submitTurnMutation.isPending || isAnimating}
                  onClick={handleSkip}
                  className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-600 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
                >
                  Skip Level
                </button>
                <button
                  type="button"
                  disabled={
                    submitTurnMutation.isPending ||
                    isAnimating ||
                    commandQueue.length === 0
                  }
                  onClick={handleSubmit}
                  className="flex-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
                >
                  {submitTurnMutation.isPending
                    ? "Executing..."
                    : "RUN COMMANDS"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ArcadeRunningLayout>
  );
};

export default LogicPathRunningView;
