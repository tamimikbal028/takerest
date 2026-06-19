import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type { SumMatrixRound, SumMatrixTurnResponse } from "./sumMatrix.types";
import type { SubmitArcadeTurnResponse } from "@/types";
import gamingHooks from "@/hooks/useGaming";
import { Check, Lock, RotateCcw } from "lucide-react";

interface SumMatrixRunningViewProps {
  sessionId: string;
  firstRound: SumMatrixRound;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  onFinish: (score: number) => void;
}

const SumMatrixRunningView = ({
  sessionId,
  firstRound,
  totalQuestions,
  maxSkips,
  maxMistakes,
  onFinish,
}: SumMatrixRunningViewProps) => {
  const [currentRound, setCurrentRound] = useState<SumMatrixRound>(firstRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstRound?.timeLimit || 45);

  const [gridNumbers, setGridNumbers] = useState<number[]>(
    firstRound.gridNumbers
  );
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [submitErrorState, setSubmitErrorState] = useState<boolean>(false);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSkippedRef = useRef(false);

  const size = currentRound.size;

  // Calculate current row sums
  const rowSums = useMemo(() => {
    const sums = Array(size).fill(0);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        sums[r] += gridNumbers[r * size + c] || 0;
      }
    }
    return sums;
  }, [gridNumbers, size]);

  // Calculate current column sums
  const colSums = useMemo(() => {
    const sums = Array(size).fill(0);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        sums[c] += gridNumbers[r * size + c] || 0;
      }
    }
    return sums;
  }, [gridNumbers, size]);

  // Check if grid matches targets
  const isSolved = useMemo(() => {
    for (let i = 0; i < size; i++) {
      if (
        rowSums[i] !== currentRound.rowTargets[i] ||
        colSums[i] !== currentRound.colTargets[i]
      ) {
        return false;
      }
    }
    return true;
  }, [
    rowSums,
    colSums,
    currentRound.rowTargets,
    currentRound.colTargets,
    size,
  ]);

  const handleNextTurn = useCallback(
    (
      nextRound: SumMatrixRound,
      newScore: number,
      newMistakes: number,
      newSkips: number
    ) => {
      setCurrentRound(nextRound);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(nextRound?.timeLimit || 45);
      setGridNumbers(nextRound.gridNumbers);
      setSelectedCell(null);
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
      const { completed, nextQuestion } = res as SumMatrixTurnResponse;

      const serverScore =
        res.score !== undefined ? res.score : res.currentScore;
      const activeScore = serverScore !== undefined ? serverScore : localScore;

      setTimeout(() => {
        if (completed) {
          onFinish(activeScore);
        } else if (nextQuestion) {
          handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
        }
      }, 1500);
    },
    [onFinish, handleNextTurn]
  );

  const handleTimeOut = useCallback(() => {
    if (submitTurnMutation.isPending) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null, // null triggers timeout/skip
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
  ]);

  useArcadeAutoScroll();

  const handleTimeOutRef = useRef(handleTimeOut);
  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  useEffect(() => {
    setTimeLeft(currentRound?.timeLimit || 45);
  }, [currentRound]);

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
  }, [currentRound]);

  const handleCellClick = useCallback(
    (idx: number) => {
      if (submitTurnMutation.isPending) return;

      if (selectedCell === null) {
        setSelectedCell(idx);
      } else {
        if (selectedCell === idx) {
          setSelectedCell(null);
          return;
        }

        // Check adjacent cells
        const r1 = Math.floor(selectedCell / size);
        const c1 = selectedCell % size;
        const r2 = Math.floor(idx / size);
        const c2 = idx % size;

        const isAdjacent =
          (r1 === r2 && Math.abs(c1 - c2) === 1) ||
          (c1 === c2 && Math.abs(r1 - r2) === 1);

        if (isAdjacent) {
          setGridNumbers((prev) => {
            const next = [...prev];
            const temp = next[selectedCell];
            next[selectedCell] = next[idx];
            next[idx] = temp;
            return next;
          });
          setSelectedCell(null);
          setSubmitErrorState(false);
        } else {
          // Select new cell instead
          setSelectedCell(idx);
        }
      }
    },
    [selectedCell, size, submitTurnMutation.isPending]
  );

  const handleReset = () => {
    if (submitTurnMutation.isPending) return;
    setGridNumbers(currentRound.gridNumbers);
    setSelectedCell(null);
    setSubmitErrorState(false);
  };

  const handleSkip = () => {
    if (submitTurnMutation.isPending || skips >= maxSkips) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null, // skip level
      },
      {
        onSuccess: (res) => {
          handleTurnResponse(res.data, score, mistakes, nextSkips);
        },
      }
    );
  };

  const handleSubmit = () => {
    if (submitTurnMutation.isPending) return;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: { gridNumbers },
      },
      {
        onSuccess: (res) => {
          const isCorrect = res.data.isCorrect;
          let nextScore = score;
          let nextMistakes = mistakes;

          if (isCorrect) {
            nextScore =
              res.data.score !== undefined
                ? res.data.score
                : (res.data.currentScore ?? score);
          } else {
            nextScore = Math.max(0, score - 5);
            nextMistakes += 1;
            setSubmitErrorState(true);
          }

          setScore(nextScore);
          setMistakes(nextMistakes);

          handleTurnResponse(res.data, nextScore, nextMistakes, skips);
        },
      }
    );
  };

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit}
      instruction="Rearrange the numbers so their row and column sums match the goals."
      leftStats={[
        { label: "Level", value: `${currentIndex + 1}/${totalQuestions}` },
        {
          label: "Skips",
          value: `${skips}/${maxSkips}`,
          color: skips >= maxSkips ? "text-rose-600" : "text-gray-900",
        },
        {
          label: "Mistakes",
          value: `${mistakes}/${maxMistakes}`,
          color: mistakes >= maxMistakes ? "text-rose-600" : "text-gray-900",
        },
      ]}
      rightStats={[{ label: "Score", value: score }]}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 sm:max-w-md">
        {/* Dynamic Grid of size+1 x size+1 */}
        <div
          className="grid w-full gap-2 rounded-3xl border border-indigo-50 bg-indigo-50/30 p-4 shadow-sm sm:gap-3 sm:p-6"
          style={{
            gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size + 1 }).map((_, r) =>
            Array.from({ length: size + 1 }).map((_, c) => {
              const isCell = r < size && c < size;
              const isRowTarget = r < size && c === size;
              const isColTarget = r === size && c < size;
              const isCorner = r === size && c === size;

              if (isCell) {
                const idx = r * size + c;
                const value = gridNumbers[idx];
                const isSelected = selectedCell === idx;

                // Check if this cell is adjacent to the selected cell
                let isAdjacentToSelected = false;
                if (selectedCell !== null && selectedCell !== idx) {
                  const r1 = Math.floor(selectedCell / size);
                  const c1 = selectedCell % size;
                  const rAdjacent =
                    (r1 === r && Math.abs(c1 - c) === 1) ||
                    (c1 === c && Math.abs(r1 - r) === 1);
                  if (rAdjacent) {
                    isAdjacentToSelected = true;
                  }
                }

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(idx)}
                    disabled={submitTurnMutation.isPending}
                    className={`flex aspect-square cursor-pointer items-center justify-center rounded-2xl border text-xl font-extrabold shadow-xs transition-all active:scale-95 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200"
                        : isAdjacentToSelected
                          ? "border-dashed border-blue-300 bg-blue-50/20 text-blue-500 hover:bg-blue-50/40"
                          : submitErrorState
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {value}
                  </button>
                );
              }

              if (isRowTarget) {
                const target = currentRound.rowTargets[r];
                const currentSum = rowSums[r];
                const matched = currentSum === target;

                return (
                  <div
                    key={`row-target-${r}`}
                    className={`flex flex-col items-center justify-center rounded-2xl border text-center transition-all duration-300 ${
                      matched
                        ? "border-emerald-200 bg-emerald-50 font-extrabold text-emerald-700 shadow-sm shadow-emerald-50"
                        : "border-slate-100 bg-slate-50/50 text-slate-400"
                    }`}
                  >
                    <span className="text-[9px] font-black tracking-wider uppercase opacity-75 sm:text-[10px]">
                      Goal
                    </span>
                    <span className="text-base font-black sm:text-lg">
                      {target}
                    </span>
                    <span className="text-[9px] font-bold opacity-80 sm:text-[10px]">
                      ({currentSum})
                    </span>
                  </div>
                );
              }

              if (isColTarget) {
                const target = currentRound.colTargets[c];
                const currentSum = colSums[c];
                const matched = currentSum === target;

                return (
                  <div
                    key={`col-target-${c}`}
                    className={`flex flex-col items-center justify-center rounded-2xl border text-center transition-all duration-300 ${
                      matched
                        ? "border-emerald-200 bg-emerald-50 font-extrabold text-emerald-700 shadow-sm shadow-emerald-50"
                        : "border-slate-100 bg-slate-50/50 text-slate-400"
                    }`}
                  >
                    <span className="text-[9px] font-black tracking-wider uppercase opacity-75 sm:text-[10px]">
                      Goal
                    </span>
                    <span className="text-base font-black sm:text-lg">
                      {target}
                    </span>
                    <span className="text-[9px] font-bold opacity-80 sm:text-[10px]">
                      ({currentSum})
                    </span>
                  </div>
                );
              }

              if (isCorner) {
                return (
                  <div
                    key="corner-indicator"
                    className={`flex aspect-square items-center justify-center rounded-2xl border transition-all duration-300 ${
                      isSolved
                        ? "animate-pulse border-emerald-300 bg-emerald-500 text-white shadow-md shadow-emerald-100"
                        : "border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isSolved ? (
                      <Check className="h-6 w-6 stroke-[3px]" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Action Panel */}
        <div className="flex w-full justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitTurnMutation.isPending}
            className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Grid
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitTurnMutation.isPending || skips >= maxSkips}
            className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-sm font-bold text-amber-600 transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
          >
            Skip
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitTurnMutation.isPending}
          className={`h-14 w-full rounded-2xl py-3.5 font-bold text-white shadow-md transition-all duration-200 active:scale-98 disabled:opacity-50 ${
            isSolved
              ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700"
              : "bg-blue-600 shadow-blue-100 hover:bg-blue-700"
          }`}
        >
          {submitTurnMutation.isPending
            ? "Evaluating..."
            : isSolved
              ? "Submit Solution"
              : "Submit Equation"}
        </button>
      </div>
    </ArcadeRunningLayout>
  );
};

export default SumMatrixRunningView;
