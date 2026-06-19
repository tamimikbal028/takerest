import { useState, useCallback, useEffect, useRef } from "react";
import ArcadeRunningLayout from "@/app/shared/Gaming/ArcadeRunningLayout";
import { useArcadeAutoScroll } from "@/app/shared/Gaming/utils/useArcadeAutoScroll";
import type {
  GuessRow,
  LogicalDeductionFirstQuestion,
  LogicalDeductionRound,
  LogicalDeductionTurnResponse,
} from "./logicalDeduction.types";
import gamingHooks from "@/hooks/useGaming";

interface LogicalDeductionRunningViewProps {
  sessionId: string;
  firstRound: LogicalDeductionFirstQuestion;
  totalRounds: number;
  maxSkips: number;
  maxMistakes: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  onFinish: (score: number) => void;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CODE_LENGTH = 4;

// ─── Guess History Row ────────────────────────────────────────────────────────
const GuessHistoryRow = ({
  row,
  isLatest,
}: {
  row: GuessRow;
  isLatest: boolean;
}) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all ${
        isLatest ? "bg-blue-50 ring-1 ring-blue-200" : "bg-gray-50"
      }`}
    >
      <div className="flex flex-1 gap-1.5">
        {row.guess.map((digit, idx) => (
          <div
            key={idx}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-base font-black text-gray-800 shadow-sm"
          >
            {digit}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-600">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span>{row.green}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-600">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
          <span>{row.yellow}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Digit Input Slots ────────────────────────────────────────────────────────
const DigitInputRow = ({
  currentGuess,
  activeSlot,
  onSlotClick,
}: {
  currentGuess: (number | null)[];
  activeSlot: number;
  onSlotClick: (index: number) => void;
}) => (
  <div className="flex justify-center gap-3">
    {currentGuess.map((digit, idx) => (
      <button
        key={idx}
        type="button"
        onClick={() => onSlotClick(idx)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all sm:h-16 sm:w-16 sm:text-3xl ${
          idx === activeSlot
            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
            : digit !== null
              ? "border-gray-300 bg-white text-gray-800 shadow-sm"
              : "border-dashed border-gray-300 bg-gray-50 text-gray-300"
        }`}
      >
        {digit !== null ? digit : "·"}
      </button>
    ))}
  </div>
);

// ─── Digit Pad ────────────────────────────────────────────────────────────────
const DigitPad = ({
  onDigitPress,
  disabled,
}: {
  onDigitPress: (digit: number) => void;
  disabled: boolean;
}) => (
  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
    {DIGITS.map((d) => (
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => onDigitPress(d)}
        className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-100 bg-white text-lg font-bold text-gray-800 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 active:scale-95 disabled:opacity-40 sm:h-12"
      >
        {d}
      </button>
    ))}
  </div>
);

// ─── Correct Answer Reveal (shown briefly at round end) ───────────────────────
const AnswerReveal = ({
  answer,
  solved,
}: {
  answer: number[];
  solved: boolean;
}) => (
  <div
    className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center ${
      solved ? "bg-emerald-50" : "bg-rose-50"
    }`}
  >
    <p
      className={`text-xs font-bold tracking-widest uppercase ${
        solved ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {solved ? "🎉 Correct! The code was:" : "💀 Out of guesses! Code was:"}
    </p>
    <div className="flex gap-2">
      {answer.map((d, i) => (
        <div
          key={i}
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white shadow ${
            solved ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {d}
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const LogicalDeductionRunningView = ({
  sessionId,
  firstRound,
  totalRounds,
  maxSkips,
  maxMistakes,
  onFinish,
}: LogicalDeductionRunningViewProps) => {
  const [currentRound, setCurrentRound] =
    useState<LogicalDeductionRound>(firstRound);
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState<(number | null)[]>(
    Array(CODE_LENGTH).fill(null)
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [skips, setSkips] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [revealedAnswer, setRevealedAnswer] = useState<number[] | null>(null);
  const [roundSolved, setRoundSolved] = useState(false);
  const [nextTransition, setNextTransition] = useState<{
    completed: boolean;
    nextRound: LogicalDeductionRound | null;
    newScore: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState(firstRound.timeLimit || 100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const hasSkippedRef = useRef(false);

  const submitTurnMutation = gamingHooks.useSubmitArcadeTurn();

  useArcadeAutoScroll();

  const guessesUsed = guesses.length;
  const attemptsAllowed = currentRound.attemptsAllowed;
  const guessesLeft = attemptsAllowed - guessesUsed;

  const resetForNextRound = useCallback((nextRound: LogicalDeductionRound) => {
    setCurrentRound(nextRound);
    setRoundIndex((prev) => prev + 1);
    setCurrentGuess(Array(CODE_LENGTH).fill(null));
    setActiveSlot(0);
    setGuesses([]);
    setRevealedAnswer(null);
    setRoundSolved(false);
    setTimeLeft(nextRound.timeLimit || 100);
  }, []);

  const handleNextRound = useCallback(() => {
    if (!nextTransition) return;
    if (nextTransition.completed) {
      onFinish(nextTransition.newScore);
    } else if (nextTransition.nextRound) {
      resetForNextRound(nextTransition.nextRound);
    }
    setNextTransition(null);
  }, [nextTransition, onFinish, resetForNextRound]);

  const handleDigitPress = useCallback(
    (digit: number) => {
      if (submitTurnMutation.isPending || revealedAnswer) return;
      setCurrentGuess((prev) => {
        const next = [...prev];
        next[activeSlot] = digit;
        return next;
      });
      setActiveSlot((prev) => Math.min(prev + 1, CODE_LENGTH - 1));
    },
    [activeSlot, submitTurnMutation.isPending, revealedAnswer]
  );

  const handleDelete = useCallback(() => {
    if (submitTurnMutation.isPending || revealedAnswer) return;
    setCurrentGuess((prev) => {
      const next = [...prev];
      if (next[activeSlot] !== null) {
        next[activeSlot] = null;
      } else if (activeSlot > 0) {
        next[activeSlot - 1] = null;
        setActiveSlot((s) => Math.max(s - 1, 0));
      }
      return next;
    });
  }, [activeSlot, submitTurnMutation.isPending, revealedAnswer]);

  const handleSlotClick = (index: number) => setActiveSlot(index);

  const isGuessComplete = currentGuess.every((d) => d !== null);
  const hasRepeats =
    new Set(currentGuess.filter((d) => d !== null)).size !==
    currentGuess.filter((d) => d !== null).length;

  const processResponse = useCallback(
    (data: LogicalDeductionTurnResponse) => {
      const newScore = data.currentScore ?? data.score ?? score;
      const newMistakes = data.mistakes ?? mistakes;
      const newSkips = data.skips ?? skips;

      setScore(newScore);
      setMistakes(newMistakes);
      setSkips(newSkips);

      if (data.guess) {
        const newRow: GuessRow = {
          guess: data.guess,
          green: data.green ?? 0,
          yellow: data.yellow ?? 0,
        };
        setGuesses((prev) => [...prev, newRow]);
      }

      if (data.roundCompleted) {
        setRevealedAnswer(data.correctAnswer || []);
        setRoundSolved(data.roundSolved);
        setNextTransition({
          completed: !!data.completed,
          nextRound: data.nextRound || null,
          newScore: newScore,
        });
      } else {
        setCurrentGuess(Array(CODE_LENGTH).fill(null));
        setActiveSlot(0);
      }
    },
    [score, mistakes, skips]
  );

  const handleSubmitGuess = () => {
    if (
      !isGuessComplete ||
      hasRepeats ||
      submitTurnMutation.isPending ||
      revealedAnswer
    )
      return;

    const guess = currentGuess as number[];
    submitTurnMutation.mutate(
      { sessionId, answer: { action: "guess", guess } },
      {
        onSuccess: (res) =>
          processResponse(res.data as LogicalDeductionTurnResponse),
      }
    );
  };

  const handleSkip = useCallback(() => {
    if (submitTurnMutation.isPending || revealedAnswer) return;
    submitTurnMutation.mutate(
      { sessionId, answer: { action: "skip" } },
      {
        onSuccess: (res) =>
          processResponse(res.data as LogicalDeductionTurnResponse),
      }
    );
  }, [sessionId, submitTurnMutation, revealedAnswer, processResponse]);

  const handleSkipRef = useRef(handleSkip);
  useEffect(() => {
    handleSkipRef.current = handleSkip;
  }, [handleSkip]);

  useEffect(() => {
    hasSkippedRef.current = false;
  }, [roundIndex]);

  useEffect(() => {
    const limit = currentRound.timeLimit || 100;
    setTimeLeft(limit);
    endTimeRef.current = Date.now() + limit * 1000;
  }, [roundIndex, currentRound.timeLimit]);

  useEffect(() => {
    if (revealedAnswer) {
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
          handleSkipRef.current();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roundIndex, revealedAnswer]);

  return (
    <ArcadeRunningLayout
      timeLeft={timeLeft}
      timeLimit={currentRound.timeLimit || 100}
      isHidden={false}
      instruction="Crack the Secret Code"
      leftStats={[
        { label: "Level", value: `${roundIndex + 1}/${totalRounds}` },
        {
          label: "Guesses Left",
          value: `${guessesLeft}/${attemptsAllowed}`,
          color: guessesLeft <= 1 ? "text-rose-600" : "text-gray-900",
        },
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
      <div className="w-full space-y-4">
        {/* Guess #X of Y */}
        {!revealedAnswer && (
          <p className="text-center text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Guess #{guessesUsed + 1} of {attemptsAllowed}
          </p>
        )}

        {/* Guess History */}
        {guesses.length > 0 && (
          <div className="space-y-1.5">
            {guesses.map((row, idx) => (
              <GuessHistoryRow
                key={idx}
                row={row}
                isLatest={idx === guesses.length - 1}
              />
            ))}
          </div>
        )}

        {/* Round end reveal */}
        {revealedAnswer && (
          <div className="space-y-4">
            <AnswerReveal answer={revealedAnswer} solved={roundSolved} />
            {nextTransition && (
              <button
                type="button"
                onClick={handleNextRound}
                className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                {nextTransition.completed ? "Finish Game" : "Next Level"}
              </button>
            )}
          </div>
        )}

        {/* Input area — hidden while showing round reveal */}
        {!revealedAnswer && (
          <div className="space-y-4">
            <DigitInputRow
              currentGuess={currentGuess}
              activeSlot={activeSlot}
              onSlotClick={handleSlotClick}
            />

            {hasRepeats && (
              <p className="text-center text-xs font-semibold text-rose-500">
                ⚠ No repeating digits allowed!
              </p>
            )}

            <DigitPad
              onDigitPress={handleDigitPress}
              disabled={submitTurnMutation.isPending}
            />

            <div className="flex justify-between gap-3">
              <button
                type="button"
                disabled={submitTurnMutation.isPending}
                onClick={handleDelete}
                className="flex h-14 flex-1 items-center justify-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-100 active:scale-[0.98] disabled:opacity-40"
              >
                Delete
              </button>
              <button
                type="button"
                disabled={submitTurnMutation.isPending}
                onClick={handleSkip}
                className="flex h-14 flex-1 items-center justify-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 text-sm font-bold text-amber-600 transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitGuess}
                disabled={
                  !isGuessComplete || hasRepeats || submitTurnMutation.isPending
                }
                className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitTurnMutation.isPending ? "Checking…" : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ArcadeRunningLayout>
  );
};

export default LogicalDeductionRunningView;
