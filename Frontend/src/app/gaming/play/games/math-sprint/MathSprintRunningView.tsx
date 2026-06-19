import { useState, useEffect, useRef, useCallback } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type { MathQuestion } from "./mathSprint.types";
import type { SubmitArcadeTurnResponse } from "@/types";
import gamingHooks from "@/hooks/useGaming";

interface MathSprintRunningViewProps {
  sessionId: string;
  firstQuestion: MathQuestion;
  totalQuestions: number;
  totalLevels: number;
  questionsPerLevel: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const MathSprintRunningView = ({
  sessionId,
  firstQuestion,
  totalLevels,
  questionsPerLevel,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: MathSprintRunningViewProps) => {
  const [currentQuestion, setCurrentQuestion] =
    useState<MathQuestion>(firstQuestion);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstQuestion?.timeLimit || 5);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextTurn = useCallback((
    nextQuestion: MathQuestion,
    newScore: number,
    newMistakes: number,
    newSkips: number
  ) => {
    setCurrentQuestion(nextQuestion);
    setCurrentIndex((prev) => prev + 1);
    setTimeLeft(nextQuestion?.timeLimit || 5);
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
    setTimeLeft(currentQuestion.timeLimit);
    endTimeRef.current = Date.now() + currentQuestion.timeLimit * 1000;
  }, [currentQuestion]);

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
  }, [currentQuestion, selectedOption, correctAnswer]);

  const submitAnswer = (selectedAnswer: number) => {
    if (
      selectedOption !== null ||
      correctAnswer !== null ||
      submitTurnMutation.isPending
    )
      return;
    setSelectedOption(selectedAnswer);

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: selectedAnswer,
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

  const currentLevel = Math.floor(currentIndex / questionsPerLevel) + 1;
  const questionInLevel = (currentIndex % questionsPerLevel) + 1;

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentQuestion.timeLimit}
      instruction="Solve the Equation"
      leftStats={[
        { label: "Level", value: `${currentLevel}/${totalLevels}` },
        { label: "Question", value: `${questionInLevel}/${questionsPerLevel}` },
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
      <div className="w-full space-y-5 sm:space-y-10">
        <div className="flex items-center justify-center text-center">
          <p
            className={`font-black tracking-tight text-gray-900 transition-all duration-300 ${
              currentQuestion.prompt.length > 15
                ? "text-2xl sm:text-4xl md:text-5xl lg:text-6xl"
                : currentQuestion.prompt.length > 10
                  ? "text-3xl sm:text-5xl md:text-6xl lg:text-7xl"
                  : "text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
            }`}
          >
            {currentQuestion.prompt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => {
            const isCorrectAnswer =
              correctAnswer !== null && option === correctAnswer;
            const isWrongSelection =
              selectedOption === option &&
              correctAnswer !== null &&
              option !== correctAnswer;

            return (
              <button
                key={option}
                type="button"
                onClick={() => submitAnswer(option)}
                disabled={
                  selectedOption !== null || submitTurnMutation.isPending
                }
                className={`rounded-2xl border-2 px-4 py-4 text-lg font-black transition-all sm:rounded-3xl sm:px-8 sm:py-5 sm:text-xl ${
                  isCorrectAnswer
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                    : isWrongSelection
                      ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-100"
                      : "border-gray-100 bg-gray-50/50 text-gray-700 shadow-sm hover:border-blue-200 hover:bg-blue-50"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </ArcadeRunningLayout>
  );
};

export default MathSprintRunningView;
