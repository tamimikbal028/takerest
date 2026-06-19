import { useState } from "react";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import type { AxiosError } from "axios";
import ArcadeIdleView from "@/app/shared/Gaming/ArcadeIdleView";
import ArcadeFinishedView from "@/app/shared/Gaming/ArcadeFinishedView";
import ArcadeContainer from "@/app/shared/Gaming/ArcadeContainer";
import type { LogicalDeduction2Round } from "./logicalDeduction2.types";
import {
  GAME_KEY,
  MAX_SKIPS,
  MAX_MISTAKES,
  INSTRUCTIONS,
} from "./logicalDeduction2.constants";
import LogicalDeduction2RunningView from "./LogicalDeduction2RunningView";

const LogicalDeduction2Game = () => {
  const startMutation = gamingHooks.useStartArcadeGame();

  const [firstRound, setFirstRound] = useState<LogicalDeduction2Round | null>(
    null
  );
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [actualScore, setActualScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  const handleStartSession = () => {
    startMutation.mutate(GAME_KEY, {
      onSuccess: (response) => {
        const firstQ = response.data.firstQuestion as LogicalDeduction2Round;
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
          rulesText={INSTRUCTIONS}
        />
      )}

      {phase === "running" && firstRound && (
        <LogicalDeduction2RunningView
          sessionId={sessionId}
          firstRound={firstRound}
          totalQuestions={totalQuestions}
          maxSkips={MAX_SKIPS}
          maxMistakes={MAX_MISTAKES}
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

export default LogicalDeduction2Game;
