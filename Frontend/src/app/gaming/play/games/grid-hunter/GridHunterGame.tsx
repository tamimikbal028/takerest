import { useState } from "react";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import type { AxiosError } from "axios";
import ArcadeIdleView from "@/app/shared/Gaming/ArcadeIdleView";
import ArcadeFinishedView from "@/app/shared/Gaming/ArcadeFinishedView";
import ArcadeContainer from "@/app/shared/Gaming/ArcadeContainer";
import GridHunterRunningView from "./GridHunterRunningView";
import type { GridHunterRound } from "./gridHunter.types";
import {
  MAX_SKIPS,
  POINTS_PER_CORRECT,
  PENALTY_PER_WRONG,
  GRID_HUNTER_RULES,
  MAX_MISTAKES,
} from "./gridHunter.constants";

const GridHunterGame = () => {
  const startMutation = gamingHooks.useStartArcadeGame();

  const [firstRound, setFirstRound] = useState<GridHunterRound | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [actualScore, setActualScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  const handleStartSession = () => {
    startMutation.mutate("grid-hunter", {
      onSuccess: (response) => {
        setFirstRound(response.data.firstQuestion);
        setTotalQuestions(response.data.totalQuestions);
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
          rulesText={GRID_HUNTER_RULES}
        />
      )}

      {phase === "running" && firstRound && (
        <GridHunterRunningView
          sessionId={sessionId}
          firstRound={firstRound}
          totalQuestions={totalQuestions}
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

export default GridHunterGame;
