import { useState, useEffect, useRef, useCallback } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import gamingHooks from "@/hooks/useGaming";
import type { SpeedEquateRound } from "./speedEquate.types";
import type { SubmitArcadeTurnResponse } from "@/types";

interface SpeedEquateRunningViewProps {
  sessionId: string;
  firstRound: SpeedEquateRound;
  totalQuestions: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

interface CardItem {
  id: string;
  val: string;
  originalIndex: number;
}

const SpeedEquateRunningView = ({
  sessionId,
  firstRound,
  totalQuestions,
  maxSkips,
  maxMistakes,
  pointsPerCorrect,
  penaltyPerWrong,
  onFinish,
}: SpeedEquateRunningViewProps) => {
  const [currentRound, setCurrentRound] =
    useState<SpeedEquateRound>(firstRound);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skips, setSkips] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(firstRound?.timeLimit || 20);

  // Card workspace state
  const [availableCards, setAvailableCards] = useState<CardItem[]>([]);
  const [workspace, setWorkspace] = useState<CardItem[]>([]);

  // Feedback animations
  const [feedbackStatus, setFeedbackStatus] = useState<
    "correct" | "wrong" | "skipped" | null
  >(null);
  const [serverCorrectAnswer, setServerCorrectAnswer] = useState<string | null>(
    null
  );

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSkippedRef = useRef(false);

  // Initialize available cards when currentRound changes
  useEffect(() => {
    if (currentRound && currentRound.cards) {
      const items: CardItem[] = currentRound.cards.map((val, idx) => ({
        id: `card-${idx}-${val}`,
        val,
        originalIndex: idx,
      }));
      setAvailableCards(items);
      setWorkspace([]);
      setFeedbackStatus(null);
      setServerCorrectAnswer(null);
    }
  }, [currentRound]);

  const handleNextTurn = useCallback(
    (
      nextRound: SpeedEquateRound,
      newScore: number,
      newMistakes: number,
      newSkips: number
    ) => {
      setCurrentRound(nextRound);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(nextRound?.timeLimit || 20);
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
      localSkips: number,
      isSkip = false
    ) => {
      const { completed, isCorrect, correctAnswer, nextQuestion } = res;
      const serverScore =
        res.score !== undefined ? res.score : res.currentScore;
      const activeScore = serverScore !== undefined ? serverScore : localScore;

      if (isSkip) {
        setFeedbackStatus("skipped");
      } else {
        setFeedbackStatus(isCorrect ? "correct" : "wrong");
      }
      setServerCorrectAnswer(correctAnswer || "");

      setTimeout(() => {
        if (completed) {
          onFinish(activeScore);
        } else if (nextQuestion) {
          handleNextTurn(nextQuestion, activeScore, localMistakes, localSkips);
        }
      }, 1500); // 1.5s delay to show feedback + correct answer
    },
    [onFinish, handleNextTurn]
  );

  const handleTimeOut = useCallback(() => {
    if (submitTurnMutation.isPending) return;
    const nextSkips = skips + 1;

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: null, // skipped
      },
      {
        onSuccess: (res) => {
          handleTurnResponse(res.data, score, mistakes, nextSkips, true);
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
    if (feedbackStatus !== null) {
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
  }, [currentRound, feedbackStatus]);

  // Click card in available pool -> Add to workspace
  const handleSelectCard = (item: CardItem) => {
    if (feedbackStatus !== null || submitTurnMutation.isPending) return;
    setAvailableCards((prev) => prev.filter((c) => c.id !== item.id));
    setWorkspace((prev) => [...prev, item]);
  };

  // Click static operator -> Add to workspace
  const handleSelectOperator = (op: string) => {
    if (feedbackStatus !== null || submitTurnMutation.isPending) return;
    const newOpCard: CardItem = {
      id: `op-${Date.now()}-${Math.random()}`,
      val: op,
      originalIndex: -1,
    };
    setWorkspace((prev) => [...prev, newOpCard]);
  };

  // Click card in workspace -> Return to available pool (and sort by original index)
  const handleRemoveCard = (item: CardItem) => {
    if (feedbackStatus !== null || submitTurnMutation.isPending) return;
    setWorkspace((prev) => prev.filter((c) => c.id !== item.id));
    if (!isOperator(item.val)) {
      setAvailableCards((prev) => {
        const updated = [...prev, item];
        return updated.sort((a, b) => a.originalIndex - b.originalIndex);
      });
    }
  };

  // Clear workspace
  const handleClearWorkspace = () => {
    if (feedbackStatus !== null || submitTurnMutation.isPending) return;
    const numbersInWorkspace = workspace.filter((c) => !isOperator(c.val));
    setAvailableCards((prev) => {
      const updated = [...prev, ...numbersInWorkspace];
      return updated.sort((a, b) => a.originalIndex - b.originalIndex);
    });
    setWorkspace([]);
  };

  // Manual Skip
  const handleManualSkip = () => {
    if (feedbackStatus !== null || submitTurnMutation.isPending) return;
    hasSkippedRef.current = true;
    handleTimeOut();
  };

  // Submit formula
  const handleSubmitFormula = () => {
    if (
      workspace.length === 0 ||
      feedbackStatus !== null ||
      submitTurnMutation.isPending
    )
      return;

    const answerTokens = workspace.map((w) => w.val);

    submitTurnMutation.mutate(
      {
        sessionId,
        answer: answerTokens,
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

  const isOperator = (val: string) =>
    ["+", "-", "*", "/", "(", ")"].includes(val);

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit}
      instruction="Combine cards to equal the Target Value!"
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
      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center justify-center space-y-3 py-5">
        {/* Target Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
            Target Value
          </div>
          <div className="mt-1 text-6xl font-black tracking-tight text-blue-600 drop-shadow-sm select-none">
            {currentRound.target}
          </div>
        </div>

        {/* Workspace Zone */}
        <div className="w-full px-4">
          <div className="mb-1.5 ml-1 text-xs font-bold text-gray-400">
            Your Equation:
          </div>
          <div
            className={`flex min-h-[72px] w-full flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-all ${
              feedbackStatus === "correct"
                ? "border-emerald-400 bg-emerald-50/40"
                : feedbackStatus === "wrong"
                  ? "border-rose-400 bg-rose-50/40"
                  : feedbackStatus === "skipped"
                    ? "border-amber-400 bg-amber-50/40"
                    : workspace.length === 0
                      ? "border-gray-200 bg-gray-50/50"
                      : "border-blue-200 bg-blue-50/10"
            }`}
          >
            {workspace.length === 0 ? (
              <span className="text-sm font-medium text-gray-400 select-none">
                Tap cards below to build equation...
              </span>
            ) : (
              workspace.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRemoveCard(item)}
                  className={`rounded-xl border px-4 py-2 font-mono text-xl font-black shadow-sm transition-all ${
                    feedbackStatus === "correct"
                      ? "border-emerald-200 bg-linear-to-br from-emerald-50 to-emerald-100 text-emerald-700 hover:border-emerald-300"
                      : feedbackStatus === "wrong"
                        ? "border-rose-200 bg-linear-to-br from-rose-50 to-rose-100 text-rose-700 hover:border-rose-300"
                        : feedbackStatus === "skipped"
                          ? "border-amber-200 bg-linear-to-br from-amber-50 to-amber-100 text-amber-700 hover:border-amber-300"
                          : isOperator(item.val)
                            ? "border-indigo-200 bg-linear-to-br from-indigo-50 to-indigo-100 text-indigo-700 hover:border-indigo-300"
                            : "border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 text-blue-700 hover:border-blue-300"
                  }`}
                >
                  {item.val}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Clean inline feedback */}
        {feedbackStatus !== null && (
          <div className="flex flex-col items-center justify-center space-y-1 transition-all">
            {feedbackStatus === "correct" && (
              <span className="text-lg font-extrabold text-emerald-600">
                ✓ Correct! (+{pointsPerCorrect} points)
              </span>
            )}
            {feedbackStatus === "skipped" && (
              <span className="text-lg font-extrabold text-amber-600">
                ↷ Skipped!
              </span>
            )}
            {feedbackStatus === "wrong" && (
              <div className="flex flex-col items-center justify-center space-y-1 text-center">
                <span className="text-lg font-extrabold text-rose-600">
                  ✗ Incorrect! (-{penaltyPerWrong} points)
                </span>
                {serverCorrectAnswer && (
                  <span className="text-xs font-medium text-gray-500">
                    Correct solution was:{" "}
                    <span className="font-mono font-bold text-gray-700">
                      {serverCorrectAnswer}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Available Cards Pool */}
        <div className="flex w-full flex-col space-y-4 px-4">
          {/* Numbers Row */}
          <div>
            <div className="mb-2 text-xs font-bold text-gray-400">Numbers:</div>
            <div className="flex min-h-[48px] w-full flex-wrap justify-center gap-2">
              {availableCards
                .filter((item) => !isOperator(item.val))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCard(item)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-white font-mono text-xl font-black text-blue-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    {item.val}
                  </button>
                ))}
            </div>
          </div>

          {/* Operators Row */}
          <div>
            <div className="mb-2 text-xs font-bold text-gray-400">
              Operators & Brackets:
            </div>
            <div className="flex min-h-[48px] w-full flex-wrap justify-center gap-2">
              {["+", "-", "*", "(", ")"].map((op) => (
                <button
                  key={`static-op-${op}`}
                  onClick={() => handleSelectOperator(op)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100 bg-white font-mono text-xl font-black text-indigo-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Zone */}
        <div className="mt-2 flex w-full justify-evenly gap-3 px-4">
          <button
            onClick={handleClearWorkspace}
            disabled={
              workspace.length === 0 ||
              feedbackStatus !== null ||
              submitTurnMutation.isPending
            }
            className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200/80 active:bg-gray-200 disabled:opacity-50"
          >
            Clear
          </button>

          <button
            onClick={handleManualSkip}
            disabled={feedbackStatus !== null || submitTurnMutation.isPending}
            className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100/50 active:bg-rose-100 disabled:opacity-50"
          >
            Skip
          </button>

          <button
            onClick={handleSubmitFormula}
            disabled={
              workspace.length === 0 ||
              feedbackStatus !== null ||
              submitTurnMutation.isPending
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:bg-blue-800 disabled:opacity-50 disabled:shadow-none"
          >
            {submitTurnMutation.isPending ? "Checking..." : "Submit"}
          </button>
        </div>
      </div>
    </ArcadeRunningLayout>
  );
};

export default SpeedEquateRunningView;
