import { useState, useEffect, useRef, useCallback } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type { GridHunterRound } from "./gridHunter.types";
import type { SubmitArcadeTurnResponse } from "@/types";
import gamingHooks from "@/hooks/useGaming";

interface GridHunterRunningViewProps {
  sessionId: string;
  firstRound: GridHunterRound;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const GridHunterRunningView = ({
  sessionId,
  firstRound,
  totalQuestions,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: GridHunterRunningViewProps) => {
  const [currentRound, setCurrentRound] = useState<GridHunterRound>(firstRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstRound?.timeLimit || 10);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextTurn = useCallback((
    nextRound: GridHunterRound,
    newScore: number,
    newMistakes: number,
    newSkips: number
  ) => {
    setCurrentRound(nextRound);
    setCurrentIndex((prev) => prev + 1);
    setTimeLeft(nextRound?.timeLimit || 10);
    setSelectedOption(null);
    setCorrectAnswer(null);
    setScore(newScore);
    setMistakes(newMistakes);
    setSkips(newSkips);
  }, []);

  const handleTurnResponse = useCallback((
    res: SubmitArcadeTurnResponse,
    localScore: number,
    localMistakes: number,
    localSkips: number
  ) => {
    const { completed, correctAnswer: serverCorrectAnswer, nextQuestion } = res;

    const serverScore = res.score !== undefined ? res.score : res.currentScore;
    const activeScore = serverScore !== undefined ? serverScore : localScore;

    setCorrectAnswer(serverCorrectAnswer);

    setTimeout(() => {
      if (completed) {
        onFinish(activeScore);
      } else if (nextQuestion) {
        handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
      }
    }, 800);
  }, [onFinish, handleNextTurn]);

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
  }, [skips, score, mistakes, sessionId, submitTurnMutation, handleTurnResponse]);

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
    if (selectedOption !== null || correctAnswer !== null) {
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
  }, [currentRound, selectedOption, correctAnswer]);

  const submitAnswer = (num: number) => {
    if (
      selectedOption !== null ||
      correctAnswer !== null ||
      submitTurnMutation.isPending
    )
      return;
    setSelectedOption(num);

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: num,
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

  const gridColsClass =
    {
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[currentRound.size] || "grid-cols-4";

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit}
      instruction={`Find the Smallest Number (${currentRound.size}x${currentRound.size})`}
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
      <div className="mx-auto w-full sm:max-w-md">
        <div className={`grid ${gridColsClass} gap-2 sm:gap-4`}>
          {currentRound.grid.map((num, idx) => {
            const isCorrectAnswer =
              correctAnswer !== null && num === correctAnswer;
            const isWrongSelection =
              selectedOption === num &&
              correctAnswer !== null &&
              num !== correctAnswer;

            return (
              <button
                key={`${currentIndex}-${idx}`}
                type="button"
                onClick={() => submitAnswer(num)}
                disabled={
                  selectedOption !== null || submitTurnMutation.isPending
                }
                className={`flex aspect-square items-center justify-center rounded-xl border-2 font-black transition-all duration-200 sm:rounded-2xl ${
                  currentRound.size === 4
                    ? "text-xl sm:text-3xl"
                    : currentRound.size === 5
                      ? "text-lg sm:text-2xl"
                      : "text-base sm:text-xl"
                } ${
                  isCorrectAnswer
                    ? "scale-95 border-emerald-400 bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200"
                    : isWrongSelection
                      ? "scale-95 border-rose-400 bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200"
                      : "border-gray-200 bg-white/40 text-gray-700 shadow-xs backdrop-blur-sm hover:scale-[1.02] hover:border-blue-400 hover:bg-white hover:text-blue-600 hover:shadow-md active:scale-95"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </ArcadeRunningLayout>
  );
};

export default GridHunterRunningView;
