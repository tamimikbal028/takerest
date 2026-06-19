import { useState } from "react";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import type { AxiosError } from "axios";
import ArcadeIdleView from "@/app/shared/Gaming/ArcadeIdleView";
import ArcadeFinishedView from "@/app/shared/Gaming/ArcadeFinishedView";
import ArcadeContainer from "@/app/shared/Gaming/ArcadeContainer";
import LogicalDeductionRunningView from "./LogicalDeductionRunningView";
import type { LogicalDeductionFirstQuestion } from "./logicalDeduction.types";
import {
  TOTAL_ROUNDS,
  MAX_SKIPS,
  MAX_MISTAKES,
  POINTS_PER_CORRECT,
  PENALTY_PER_WRONG,
  LOGICAL_DEDUCTION_RULES,
} from "./logicalDeduction.constants";

const LogicalDeductionGame = () => {
  const startMutation = gamingHooks.useStartArcadeGame();

  const [firstRound, setFirstRound] =
    useState<LogicalDeductionFirstQuestion | null>(null);
  const [totalRounds, setTotalRounds] = useState(TOTAL_ROUNDS);
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [actualScore, setActualScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  const handleStartSession = () => {
    startMutation.mutate("logical-deduction", {
      onSuccess: (response) => {
        const firstQ = response.data
          .firstQuestion as LogicalDeductionFirstQuestion;
        setFirstRound(firstQ);
        setTotalRounds(response.data.totalQuestions || TOTAL_ROUNDS);
        setSessionId(response.data.sessionId);
        setPhase("running");
        setActualScore(0);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        Swal.fire(
          "Error",
          err.response?.data?.message || "Failed to start",
          "error"
        );
      },
    });
  };

  const handleGameFinish = (score: number) => {
    setActualScore(score);
    setPhase("finished");
  };

  return (
    <ArcadeContainer>
      {phase === "idle" && (
        <ArcadeIdleView
          onStart={handleStartSession}
          isPreparing={startMutation.isPending}
          rulesText={LOGICAL_DEDUCTION_RULES}
        />
      )}

      {phase === "running" && firstRound && (
        <LogicalDeductionRunningView
          sessionId={sessionId}
          firstRound={firstRound}
          totalRounds={totalRounds}
          maxSkips={MAX_SKIPS}
          maxMistakes={MAX_MISTAKES}
          pointsPerCorrect={POINTS_PER_CORRECT}
          penaltyPerWrong={PENALTY_PER_WRONG}
          onFinish={handleGameFinish}
        />
      )}

      {phase === "finished" && (
        <ArcadeFinishedView
          score={actualScore}
          onPlayAgain={handleStartSession}
          isPreparing={startMutation.isPending}
          isSubmitting={false}
        />
      )}
    </ArcadeContainer>
  );
};

export default LogicalDeductionGame;
