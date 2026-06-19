import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type { ArithmeticPathLevel } from "./arithmeticPath.types";
import type { SubmitArcadeTurnResponse } from "@/types";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import { ArrowRight } from "lucide-react";

interface ArithmeticPathRunningViewProps {
  sessionId: string;
  firstLevel: ArithmeticPathLevel;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const evalExpr = (a: number | null, op: string, b: number): number | null => {
  if (a === null) return null;
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  if (op === "/") {
    if (b === 0 || a % b !== 0) return null;
    return a / b;
  }
  return null;
};

const COLOR_INDIGO_HEX = "#4f46e5";
const COLOR_ROSE_HEX = "#e11d48";
const COLOR_GREEN_HEX = "#22c55e";

const ArithmeticPathRunningView = ({
  sessionId,
  firstLevel,
  totalQuestions,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: ArithmeticPathRunningViewProps) => {
  const [currentLevel, setCurrentLevel] =
    useState<ArithmeticPathLevel>(firstLevel);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstLevel?.timeLimit || 40);

  // Path indices in the 1D grid representation
  const [selectedPath, setSelectedPath] = useState<number[]>([0]);

  // Reveal path if user makes a mistake
  const [revealCorrectPath, setRevealCorrectPath] = useState<number[] | null>(
    null
  );
  const [submitErrorState, setSubmitErrorState] = useState<boolean>(false);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSkippedRef = useRef(false);

  const size = currentLevel.size;

  // Running total calculation for the current selected path
  const pathSteps = useMemo(() => {
    const startCell = currentLevel.grid[0];
    if (!startCell) return { steps: [], finalValue: null };

    let currentVal = startCell.val;
    const steps: {
      index: number;
      op: string;
      val: number;
      result: number | null;
    }[] = [];

    for (let i = 1; i < selectedPath.length; i++) {
      const idx = selectedPath[i];
      const cell = currentLevel.grid[idx];
      if (!cell) break;

      const nextVal = evalExpr(currentVal, cell.op, cell.val);
      steps.push({
        index: idx,
        op: cell.op,
        val: cell.val,
        result: nextVal,
      });

      if (nextVal !== null) {
        currentVal = nextVal;
      } else {
        break;
      }
    }

    return {
      steps,
      finalValue: steps.length === selectedPath.length - 1 ? currentVal : null,
    };
  }, [selectedPath, currentLevel]);

  const handleNextTurn = useCallback(
    (
      nextLevel: ArithmeticPathLevel,
      newScore: number,
      newMistakes: number,
      newSkips: number
    ) => {
      setCurrentLevel(nextLevel);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(nextLevel?.timeLimit || 40);
      setSelectedPath([0]);
      setRevealCorrectPath(null);
      setSubmitErrorState(false);
      setScore(newScore);
      setMistakes(newMistakes);
      setSkips(newSkips);
    },
    []
  );

  const handleTurnResponse = useCallback(
    (
      res: SubmitArcadeTurnResponse,
      localScore: number,
      localMistakes: number,
      localSkips: number
    ) => {
      const { completed, correctAnswer, nextQuestion } = res;

      const serverScore =
        res.score !== undefined ? res.score : res.currentScore;
      const activeScore = serverScore !== undefined ? serverScore : localScore;

      if (correctAnswer) {
        setRevealCorrectPath(correctAnswer.correctPath || null);
      }

      setTimeout(() => {
        if (completed) {
          onFinish(activeScore);
        } else if (nextQuestion) {
          handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
        }
      }, 2000);
    },
    [onFinish, handleNextTurn]
  );

  const handleTimeOut = useCallback(() => {
    if (submitTurnMutation.isPending || revealCorrectPath !== null) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null,
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
    handleTurnResponse,
    revealCorrectPath,
  ]);

  useArcadeAutoScroll();

  const handleTimeOutRef = useRef(handleTimeOut);
  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  useEffect(() => {
    setTimeLeft(currentLevel?.timeLimit || 40);
  }, [currentLevel]);

  useEffect(() => {
    hasSkippedRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!);
          if (!hasSkippedRef.current) {
            hasSkippedRef.current = true;
            handleTimeOutRef.current();
          }
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLevel]);

  // Click handler for path cells
  const handleCellClick = useCallback(
    (idx: number) => {
      if (revealCorrectPath !== null || submitTurnMutation.isPending) return;

      const pathIdx = selectedPath.indexOf(idx);

      if (pathIdx !== -1) {
        // If clicked on an already selected cell, truncate path to this point
        setSelectedPath((prev) => prev.slice(0, pathIdx + 1));
      } else {
        // Otherwise, check if it's adjacent to the last cell in the path
        const lastIdx = selectedPath[selectedPath.length - 1];
        const r1 = Math.floor(lastIdx / size);
        const c1 = lastIdx % size;
        const r2 = Math.floor(idx / size);
        const c2 = idx % size;

        const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

        if (isAdjacent) {
          setSelectedPath((prev) => [...prev, idx]);
        }
      }
    },
    [selectedPath, size, revealCorrectPath, submitTurnMutation.isPending]
  );

  const skipLevel = useCallback(() => {
    if (revealCorrectPath !== null || submitTurnMutation.isPending) return;
    hasSkippedRef.current = true;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null,
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
    handleTurnResponse,
    revealCorrectPath,
  ]);

  const submitCurrentAnswer = useCallback(() => {
    if (revealCorrectPath !== null || submitTurnMutation.isPending) return;

    const endIdx = size * size - 1;
    const reachedEnd = selectedPath[selectedPath.length - 1] === endIdx;

    if (!reachedEnd) {
      Swal.fire({
        title: "Incomplete Path",
        text: "Your path must reach the bottom-right cell before submitting.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: {
          path: selectedPath,
        },
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
            setSubmitErrorState(true);
          }

          const clampedScore = Math.max(0, newScore);
          setScore(clampedScore);
          setMistakes(nextMistakes);

          handleTurnResponse(res.data, clampedScore, nextMistakes, skips);
        },
      }
    );
  }, [
    revealCorrectPath,
    submitTurnMutation,
    selectedPath,
    size,
    sessionId,
    score,
    mistakes,
    pointsPerCorrect,
    penaltyPerWrong,
    skips,
    handleTurnResponse,
  ]);

  // Compute SVG center coordinate strings
  const svgSelectedPathD = useMemo(() => {
    if (selectedPath.length === 0) return "";
    const pts = selectedPath.map((idx) => {
      const r = Math.floor(idx / size);
      const c = idx % size;
      const x = ((c + 0.5) * 100) / size;
      const y = ((r + 0.5) * 100) / size;
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  }, [selectedPath, size]);

  const svgCorrectPathD = useMemo(() => {
    if (!revealCorrectPath) return "";
    const pts = revealCorrectPath.map((idx) => {
      const r = Math.floor(idx / size);
      const c = idx % size;
      const x = ((c + 0.5) * 100) / size;
      const y = ((r + 0.5) * 100) / size;
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  }, [revealCorrectPath, size]);

  // Left & Right stats layout panels
  const leftStats = [
    { label: "LEVEL", value: `${currentIndex + 1}/${totalQuestions}` },
    {
      label: "MISTAKES",
      value: `${mistakes}/${maxMistakes}`,
      color: mistakes > 0 ? "text-rose-500 font-bold" : "text-gray-900",
    },
    {
      label: "SKIPS",
      value: `${skips}/${maxSkips}`,
      color: skips > 0 ? "text-amber-500 font-bold" : "text-gray-900",
    },
  ];

  const rightStats = [
    { label: "SCORE", value: score, color: "text-green-600 font-bold" },
  ];

  const endIdx = size * size - 1;
  const isPathAtEnd = selectedPath[selectedPath.length - 1] === endIdx;
  const isMathCorrect = pathSteps.finalValue === currentLevel.targetValue;

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentLevel.timeLimit}
      leftStats={leftStats}
      rightStats={rightStats}
      instruction="Form a path from top-left to bottom-right to reach the target!"
    >
      <div className="flex w-full flex-col items-center space-y-6">
        {/* Math Display Banner */}
        <div className="flex w-full max-w-lg items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Start Value
            </span>
            <span className="text-3xl font-black text-indigo-600">
              {currentLevel.startValue}
            </span>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
            <ArrowRight className="h-6 w-6" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Running Total
            </span>
            <span
              className={`text-3xl font-black transition-colors ${
                isMathCorrect
                  ? "text-green-600 drop-shadow-[0_2px_8px_rgba(22,163,74,0.2)]"
                  : "text-gray-700"
              }`}
            >
              {pathSteps.finalValue ?? "???"}
            </span>
          </div>

          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-pink-50 text-pink-500">
            <ArrowRight className="h-6 w-6" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Target Value
            </span>
            <span className="text-3xl font-black text-pink-600 drop-shadow-[0_2px_8px_rgba(219,39,119,0.2)]">
              {currentLevel.targetValue}
            </span>
          </div>
        </div>

        {/* Central Interlocking Grid View */}
        <div className="relative flex w-full justify-center py-3">
          <div
            className="relative grid gap-3 rounded-2xl border border-gray-100 bg-white/40 p-3 shadow-md select-none"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              width: "100%",
              maxWidth: size === 3 ? "280px" : size === 4 ? "340px" : "400px",
              aspectRatio: "1 / 1",
            }}
          >
            {/* SVG Path Layer */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            >
              {/* Correct Answer Path (Revealed on error) */}
              {revealCorrectPath !== null && svgCorrectPathD && (
                <path
                  d={svgCorrectPathD}
                  fill="none"
                  stroke={COLOR_GREEN_HEX}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-pulse opacity-90"
                  strokeDasharray="3,3"
                />
              )}

              {/* User Active Path */}
              {svgSelectedPathD && (
                <path
                  d={svgSelectedPathD}
                  fill="none"
                  stroke={submitErrorState ? COLOR_ROSE_HEX : COLOR_INDIGO_HEX}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* Grid Buttons */}
            {currentLevel.grid.map((cell, idx) => {
              const r = Math.floor(idx / size);
              const c = idx % size;
              const isStart = idx === 0;
              const isEnd = idx === size * size - 1;
              const isSelected = selectedPath.includes(idx);
              const selectedStep = selectedPath.indexOf(idx);

              // Adjacent checking
              const lastIdx = selectedPath[selectedPath.length - 1];
              const lr = Math.floor(lastIdx / size);
              const lc = lastIdx % size;
              const isNextPossible =
                !isSelected && Math.abs(lr - r) + Math.abs(lc - c) === 1;

              const isRevealCorrect = revealCorrectPath?.includes(idx) ?? false;

              let cellBg =
                "bg-white hover:bg-gray-50 border-gray-100 text-gray-700";

              if (isStart) {
                cellBg = "bg-indigo-50 border-indigo-200 text-indigo-900";
              } else if (isEnd) {
                cellBg = "bg-pink-50 border-pink-200 text-pink-900";
              }

              if (isSelected) {
                cellBg = "text-white shadow-none";
              } else if (isRevealCorrect) {
                cellBg = "text-white shadow-none";
              } else if (isNextPossible) {
                cellBg =
                  "bg-indigo-50/50 hover:bg-indigo-50 border-dashed border-indigo-200 text-indigo-500 cursor-pointer";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={
                    revealCorrectPath !== null ||
                    submitTurnMutation.isPending ||
                    (!isSelected && !isNextPossible)
                  }
                  style={
                    isSelected
                      ? {
                          backgroundColor: submitErrorState
                            ? COLOR_ROSE_HEX
                            : COLOR_INDIGO_HEX,
                          borderColor: submitErrorState
                            ? COLOR_ROSE_HEX
                            : COLOR_INDIGO_HEX,
                        }
                      : isRevealCorrect
                        ? {
                            backgroundColor: COLOR_GREEN_HEX,
                            borderColor: COLOR_GREEN_HEX,
                          }
                        : undefined
                  }
                  className={`relative z-10 flex flex-col items-center justify-center rounded-2xl border text-center transition-all focus:outline-hidden ${cellBg} ${
                    !isSelected && !isNextPossible
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer active:scale-95"
                  }`}
                >
                  {/* Start / End mini tags */}
                  {isStart && (
                    <span
                      className={`absolute top-1 left-1.5 text-[7px] font-black tracking-wider uppercase ${
                        isSelected
                          ? submitErrorState
                            ? "text-rose-200"
                            : "text-indigo-200"
                          : "text-indigo-400"
                      }`}
                    >
                      Start
                    </span>
                  )}
                  {isEnd && (
                    <span
                      className={`absolute right-1.5 bottom-1 text-[7px] font-black tracking-wider uppercase ${
                        isSelected
                          ? submitErrorState
                            ? "text-rose-200"
                            : "text-indigo-200"
                          : "text-pink-400"
                      }`}
                    >
                      End
                    </span>
                  )}

                  {/* Math Operator & Value */}
                  <span className="text-xl font-extrabold tracking-tight">
                    {isStart ? cell.val : `${cell.op} ${cell.val}`}
                  </span>

                  {/* Selected Path Step Number Indicator */}
                  {isSelected && selectedStep !== -1 && (
                    <span
                      className={`absolute top-1 right-2 text-[8px] font-black opacity-80 ${
                        submitErrorState ? "text-white" : "text-indigo-200"
                      }`}
                    >
                      #{selectedStep + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions panel */}
        <div className="flex w-full max-w-md justify-between gap-3">
          <button
            type="button"
            disabled={
              skips >= maxSkips ||
              revealCorrectPath !== null ||
              submitTurnMutation.isPending
            }
            onClick={skipLevel}
            className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-sm font-bold text-amber-600 transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={submitCurrentAnswer}
            disabled={
              !isPathAtEnd ||
              revealCorrectPath !== null ||
              submitTurnMutation.isPending
            }
            className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitTurnMutation.isPending ? "Checking…" : "Submit Path"}
          </button>
        </div>
      </div>
    </ArcadeRunningLayout>
  );
};

export default ArithmeticPathRunningView;
