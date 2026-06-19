import { useState } from "react";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import type { AxiosError } from "axios";
import ArcadeIdleView from "@/app/shared/Gaming/ArcadeIdleView";
import ArcadeFinishedView from "@/app/shared/Gaming/ArcadeFinishedView";
import ArcadeContainer from "@/app/shared/Gaming/ArcadeContainer";
import type { SumMatrixRound } from "./sumMatrix.types";
import {
  DEFAULT_MAX_SKIPS,
  DEFAULT_MAX_MISTAKES,
  GAME_INSTRUCTIONS,
} from "./sumMatrix.constants";
import SumMatrixRunningView from "./SumMatrixRunningView";

const SumMatrixGame = () => {
  const startMutation = gamingHooks.useStartArcadeGame();

  const [firstRound, setFirstRound] = useState<SumMatrixRound | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [actualScore, setActualScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  const handleStartSession = () => {
    startMutation.mutate("sum-matrix", {
      onSuccess: (response) => {
        const firstQ = response.data.firstQuestion as SumMatrixRound;
        setFirstRound(firstQ);
        setTotalQuestions(response.data.totalQuestions || 10);
        setSessionId(response.data.sessionId);
        setPhase("running");
        setActualScore(0);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        Swal.fire(
          "Error",
          err.response?.data?.message || "Failed to start session",
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
          rulesText={GAME_INSTRUCTIONS}
        />
      )}

      {phase === "running" && firstRound && (
        <SumMatrixRunningView
          sessionId={sessionId}
          firstRound={firstRound}
          totalQuestions={totalQuestions}
          maxSkips={DEFAULT_MAX_SKIPS}
          maxMistakes={DEFAULT_MAX_MISTAKES}
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

export default SumMatrixGame;
