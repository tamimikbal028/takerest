import { useState, useEffect, useRef, useCallback } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type { OperatorGridRound } from "./operatorGrid.types";
import type { SubmitArcadeTurnResponse } from "@/types";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";

interface OperatorGridRunningViewProps {
  sessionId: string;
  firstRound: OperatorGridRound;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const evalExpr = (
  a: number | null,
  op: string | null,
  b: number | null
): number | null => {
  if (a === null || b === null || !op) return null;
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  if (op === "/") {
    if (b === 0 || a % b !== 0) return null;
    return a / b;
  }
  return null;
};

const OperatorGridRunningView = ({
  sessionId,
  firstRound,
  totalQuestions,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: OperatorGridRunningViewProps) => {
  const [currentRound, setCurrentRound] =
    useState<OperatorGridRound>(firstRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstRound?.timeLimit || 40);

  // User placed pool indices in the 3x3 grid (placedIndices[gridIdx] is pool index or null)
  const [placedIndices, setPlacedIndices] = useState<(number | null)[]>(
    Array(9).fill(null)
  );

  // Selection states
  const [selectedGridSlot, setSelectedGridSlot] = useState<number | null>(null);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState<number | null>(
    null
  );

  // Correct numbers from backend validation to show visual corrections
  const [correctGridNumbers, setCorrectGridNumbers] = useState<number[] | null>(
    null
  );

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextTurn = useCallback(
    (
      nextRound: OperatorGridRound,
      newScore: number,
      newMistakes: number,
      newSkips: number
    ) => {
      setCurrentRound(nextRound);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(nextRound?.timeLimit || 40);
      setPlacedIndices(Array(9).fill(null));
      setSelectedGridSlot(null);
      setSelectedPoolIndex(null);
      setCorrectGridNumbers(null);
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
        setCorrectGridNumbers(correctAnswer.correctGridNumbers || null);
      }

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
  ]);

  useArcadeAutoScroll();

  const hasSkippedRef = useRef(false);

  useEffect(() => {
    hasSkippedRef.current = false;
  }, [currentIndex]);

  const endTimeRef = useRef<number>(0);
  const handleTimeOutRef = useRef(handleTimeOut);

  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  useEffect(() => {
    setTimeLeft(currentRound.timeLimit);
    endTimeRef.current = Date.now() + currentRound.timeLimit * 1000;
  }, [currentRound]);

  useEffect(() => {
    if (correctGridNumbers !== null) {
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
  }, [currentRound, correctGridNumbers]);

  const handleGridSlotClick = useCallback(
    (gridIdx: number) => {
      if (correctGridNumbers !== null || submitTurnMutation.isPending) return;

      if (selectedPoolIndex !== null) {
        // Place selected pool index into this grid slot
        setPlacedIndices((prev) => {
          const next = [...prev];
          // If this pool index was already placed somewhere else, clear that slot
          const existingSlot = next.indexOf(selectedPoolIndex);
          if (existingSlot !== -1) {
            next[existingSlot] = null;
          }
          next[gridIdx] = selectedPoolIndex;
          return next;
        });
        setSelectedPoolIndex(null);
        setSelectedGridSlot(null);
      } else {
        // If it already had a placed number, return it to the pool (clear the slot)
        if (placedIndices[gridIdx] !== null) {
          setPlacedIndices((prev) => {
            const next = [...prev];
            next[gridIdx] = null;
            return next;
          });
          setSelectedGridSlot(null);
        } else {
          // Select this slot
          setSelectedGridSlot((prev) => (prev === gridIdx ? null : gridIdx));
        }
      }
    },
    [
      selectedPoolIndex,
      placedIndices,
      correctGridNumbers,
      submitTurnMutation.isPending,
    ]
  );

  const handlePoolCardClick = useCallback(
    (poolIdx: number) => {
      if (correctGridNumbers !== null || submitTurnMutation.isPending) return;

      // If already placed, do nothing
      if (placedIndices.includes(poolIdx)) return;

      if (selectedGridSlot !== null) {
        // Place into the selected grid slot
        setPlacedIndices((prev) => {
          const next = [...prev];
          next[selectedGridSlot] = poolIdx;
          return next;
        });
        setSelectedGridSlot(null);
        setSelectedPoolIndex(null);
      } else {
        // Select this pool index
        setSelectedPoolIndex((prev) => (prev === poolIdx ? null : poolIdx));
      }
    },
    [
      selectedGridSlot,
      placedIndices,
      correctGridNumbers,
      submitTurnMutation.isPending,
    ]
  );

  const submitCurrentAnswer = useCallback(() => {
    if (correctGridNumbers !== null || submitTurnMutation.isPending) return;

    // Verify all 9 slots are filled
    const allSlotsFilled = placedIndices.every((idx) => idx !== null);

    if (!allSlotsFilled) {
      Swal.fire({
        title: "Incomplete Grid",
        text: "Please place a number in all 9 slots before submitting.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // Map pool indices back to numbers
    const compiledGridNumbers = placedIndices.map(
      (idx) => currentRound.numbersPool[idx!]
    );

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: {
          gridNumbers: compiledGridNumbers,
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
          }

          const clampedScore = Math.max(0, newScore);
          setScore(clampedScore);
          setMistakes(nextMistakes);

          handleTurnResponse(res.data, clampedScore, nextMistakes, skips);
        },
      }
    );
  }, [
    correctGridNumbers,
    submitTurnMutation,
    placedIndices,
    currentRound.numbersPool,
    sessionId,
    score,
    mistakes,
    pointsPerCorrect,
    penaltyPerWrong,
    skips,
    handleTurnResponse,
  ]);

  // Real-time evaluation results helper
  const getRowEvaluation = (r: number) => {
    const num0Idx = placedIndices[r * 3];
    const num1Idx = placedIndices[r * 3 + 1];
    const num2Idx = placedIndices[r * 3 + 2];

    if (num0Idx === null || num1Idx === null || num2Idx === null) {
      return { evaluated: false, isMatching: false };
    }

    const n0 = currentRound.numbersPool[num0Idx];
    const n1 = currentRound.numbersPool[num1Idx];
    const n2 = currentRound.numbersPool[num2Idx];

    const op1 = currentRound.correctHorizontalOperators[r * 2];
    const op2 = currentRound.correctHorizontalOperators[r * 2 + 1];
    const target = currentRound.rowTargets[r];

    const firstEval = evalExpr(n0, op1, n1);
    const finalEval = evalExpr(firstEval, op2, n2);

    return {
      evaluated: true,
      isMatching: finalEval === target,
    };
  };

  const getColEvaluation = (c: number) => {
    const num0Idx = placedIndices[c];
    const num1Idx = placedIndices[c + 3];
    const num2Idx = placedIndices[c + 6];

    if (num0Idx === null || num1Idx === null || num2Idx === null) {
      return { evaluated: false, isMatching: false };
    }

    const n0 = currentRound.numbersPool[num0Idx];
    const n1 = currentRound.numbersPool[num1Idx];
    const n2 = currentRound.numbersPool[num2Idx];

    const op1 = currentRound.correctVerticalOperators[c * 2];
    const op2 = currentRound.correctVerticalOperators[c * 2 + 1];
    const target = currentRound.colTargets[c];

    const firstEval = evalExpr(n0, op1, n1);
    const finalEval = evalExpr(firstEval, op2, n2);

    return {
      evaluated: true,
      isMatching: finalEval === target,
    };
  };

  const renderCell = (rowIndex: number, colIndex: number) => {
    // 1. Numbers / Placed Slots
    if (
      rowIndex % 2 === 0 &&
      colIndex % 2 === 0 &&
      colIndex < 5 &&
      rowIndex < 5
    ) {
      const idx = (rowIndex / 2) * 3 + colIndex / 2;
      const poolIdx = placedIndices[idx];
      const val = poolIdx !== null ? currentRound.numbersPool[poolIdx] : null;

      const isSelected = selectedGridSlot === idx;
      const isRevealing = correctGridNumbers !== null;
      const serverVal = correctGridNumbers?.[idx];
      const isWrong = isRevealing && val !== serverVal;

      let cellStyle =
        "border-slate-300 bg-slate-50/80 text-slate-400 border-dashed hover:border-blue-400 hover:bg-white cursor-pointer";
      if (val !== null) {
        cellStyle =
          "bg-blue-600 text-white border-blue-600 font-extrabold cursor-pointer";
      }
      if (isSelected) {
        cellStyle =
          "border-blue-500 bg-blue-50 text-blue-600 font-bold border-2 ring-2 ring-blue-200 scale-102 cursor-pointer";
      }
      if (isRevealing) {
        cellStyle = isWrong
          ? "border-rose-400 bg-rose-500 text-white font-black scale-95"
          : "border-emerald-400 bg-emerald-500 text-white font-black scale-95";
      }

      return (
        <button
          key={`num-${rowIndex}-${colIndex}`}
          type="button"
          disabled={isRevealing || submitTurnMutation.isPending}
          onClick={() => handleGridSlotClick(idx)}
          className={`flex aspect-square items-center justify-center rounded-xl border text-lg shadow-sm transition-all duration-200 sm:rounded-2xl sm:text-2xl ${cellStyle}`}
        >
          {isRevealing ? serverVal : val !== null ? val : "?"}
        </button>
      );
    }

    // 2. Horizontal Operators (Static pre-filled)
    if (
      rowIndex % 2 === 0 &&
      colIndex % 2 !== 0 &&
      colIndex < 5 &&
      rowIndex < 5
    ) {
      const idx = (rowIndex / 2) * 2 + Math.floor((colIndex - 1) / 2);
      const opVal = currentRound.correctHorizontalOperators[idx];

      return (
        <div
          key={`hop-${idx}`}
          className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-100/50 text-lg font-black text-slate-600 shadow-xs sm:rounded-2xl sm:text-xl"
        >
          {opVal}
        </div>
      );
    }

    // 3. Vertical Operators (Static pre-filled)
    if (
      rowIndex % 2 !== 0 &&
      colIndex % 2 === 0 &&
      rowIndex < 5 &&
      colIndex < 5
    ) {
      const idx = (colIndex / 2) * 2 + Math.floor((rowIndex - 1) / 2);
      const opVal = currentRound.correctVerticalOperators[idx];

      return (
        <div
          key={`vop-${idx}`}
          className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-100/50 text-lg font-black text-slate-600 shadow-xs sm:rounded-2xl sm:text-xl"
        >
          {opVal}
        </div>
      );
    }

    // 4. Equal Labels (Row)
    if (rowIndex % 2 === 0 && colIndex === 5 && rowIndex < 5) {
      return (
        <div
          key={`eqr-${rowIndex}`}
          className="flex aspect-square items-center justify-center text-lg font-bold text-slate-400 sm:text-xl"
        >
          =
        </div>
      );
    }

    // 5. Row Targets
    if (rowIndex % 2 === 0 && colIndex === 6 && rowIndex < 5) {
      const idx = rowIndex / 2;
      const targetVal = currentRound.rowTargets[idx];
      const evalState = getRowEvaluation(idx);

      let targetStyle = "border-slate-200 bg-slate-100 text-slate-600";
      const isRevealing = correctGridNumbers !== null;
      if (isRevealing && evalState.evaluated) {
        targetStyle = evalState.isMatching
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold shadow-sm shadow-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-700 font-extrabold shadow-sm shadow-rose-100";
      }

      return (
        <div
          key={`rtar-${idx}`}
          className={`flex aspect-square items-center justify-center rounded-xl border text-lg font-bold transition-all duration-200 sm:rounded-2xl sm:text-xl ${targetStyle}`}
        >
          {targetVal}
        </div>
      );
    }

    // 6. Equal Labels (Column)
    if (rowIndex === 5 && colIndex % 2 === 0 && colIndex < 5) {
      const idx = colIndex / 2;
      return (
        <div
          key={`eqc-${idx}`}
          className="flex aspect-square items-center justify-center text-lg font-bold text-slate-400 sm:text-xl"
        >
          =
        </div>
      );
    }

    // 7. Column Targets
    if (rowIndex === 6 && colIndex % 2 === 0 && colIndex < 5) {
      const idx = colIndex / 2;
      const targetVal = currentRound.colTargets[idx];
      const evalState = getColEvaluation(idx);

      let targetStyle = "border-slate-200 bg-slate-100 text-slate-600";
      const isRevealing = correctGridNumbers !== null;
      if (isRevealing && evalState.evaluated) {
        targetStyle = evalState.isMatching
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold shadow-sm shadow-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-700 font-extrabold shadow-sm shadow-rose-100";
      }

      return (
        <div
          key={`ctar-${idx}`}
          className={`flex aspect-square items-center justify-center rounded-xl border text-lg font-bold transition-all duration-200 sm:rounded-2xl sm:text-xl ${targetStyle}`}
        >
          {targetVal}
        </div>
      );
    }

    // 8. Spacer/Empty cells
    return (
      <div key={`empty-${rowIndex}-${colIndex}`} className="aspect-square" />
    );
  };

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit}
      instruction="Place numbers from the pool into correct blank slots."
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
        {/* The 7x7 Grid */}
        <div className="grid w-full grid-cols-7 gap-1.5 rounded-3xl border border-indigo-50 bg-indigo-50/30 p-4 shadow-sm sm:gap-2.5 sm:p-6">
          {Array.from({ length: 7 }).map((_, rIdx) =>
            Array.from({ length: 7 }).map((_, cIdx) => renderCell(rIdx, cIdx))
          )}
        </div>

        {/* Selected Slot Information & Numbers Pool */}
        <div className="w-full space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center">
          <div>
            <p className="mb-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {selectedGridSlot !== null
                ? `Place a number in selected grid slot #${selectedGridSlot + 1}`
                : "Select a number from the pool to place"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {currentRound.numbersPool.map((num, idx) => {
                const isUsed = placedIndices.includes(idx);
                const isSelected = selectedPoolIndex === idx;

                let btnStyle =
                  "border-blue-200 bg-white text-blue-600 hover:bg-blue-600 hover:text-white";
                if (isUsed) {
                  btnStyle =
                    "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-40";
                } else if (isSelected) {
                  btnStyle =
                    "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-300 scale-105";
                }

                return (
                  <button
                    key={`pool-${idx}`}
                    type="button"
                    disabled={
                      isUsed ||
                      correctGridNumbers !== null ||
                      submitTurnMutation.isPending
                    }
                    onClick={() => handlePoolCardClick(idx)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-extrabold shadow-xs transition-all active:scale-90 ${btnStyle}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {placedIndices.some((idx) => idx !== null) && (
              <button
                type="button"
                onClick={() => {
                  setPlacedIndices(Array(9).fill(null));
                  setSelectedGridSlot(null);
                  setSelectedPoolIndex(null);
                }}
                disabled={
                  correctGridNumbers !== null || submitTurnMutation.isPending
                }
                className="mt-3 text-xs font-bold text-rose-500 hover:text-rose-600"
              >
                Reset Grid Numbers
              </button>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="button"
          onClick={submitCurrentAnswer}
          disabled={correctGridNumbers !== null || submitTurnMutation.isPending}
          className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-98 disabled:opacity-50"
        >
          {submitTurnMutation.isPending ? "Evaluating..." : "Submit Equation"}
        </button>
      </div>
    </ArcadeRunningLayout>
  );
};

export default OperatorGridRunningView;
