import { useState, useCallback } from "react";
import gamingHooks from "@/hooks/useGaming";
import Swal from "sweetalert2";
import type { AxiosError } from "axios";
import ArcadeIdleView from "@/app/shared/Gaming/ArcadeIdleView";
import ArcadeFinishedView from "@/app/shared/Gaming/ArcadeFinishedView";
import ArcadeContainer from "@/app/shared/Gaming/ArcadeContainer";
import type { ArithmeticPathLevel } from "./arithmeticPath.types";
import {
  MAX_SKIPS,
  POINTS_PER_CORRECT,
  PENALTY_PER_WRONG,
  ARITHMETIC_PATH_RULES,
  MAX_MISTAKES,
} from "./arithmeticPath.constants";
import ArithmeticPathRunningView from "./ArithmeticPathRunningView";

const ArithmeticPathGame = () => {
  const startMutation = gamingHooks.useStartArcadeGame();

  const [firstLevel, setFirstLevel] = useState<ArithmeticPathLevel | null>(
    null
  );
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [actualScore, setActualScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");

  const handleStartSession = useCallback(() => {
    startMutation.mutate("arithmetic-path", {
      onSuccess: (response) => {
        setFirstLevel(response.data.firstQuestion);
        setTotalQuestions(response.data.totalQuestions);
        setSessionId(response.data.sessionId);
        setPhase("running");
        setActualScore(0);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        Swal.fire(
          "Error",
          err.response?.data?.message || "Failed to start game",
          "error"
        );
      },
    });
  }, [startMutation]);

  const handleGameFinish = useCallback((score: number) => {
    setActualScore(score);
    setPhase("finished");
  }, []);

  return (
    <ArcadeContainer>
      {phase === "idle" && (
        <ArcadeIdleView
          onStart={handleStartSession}
          isPreparing={startMutation.isPending}
          rulesText={ARITHMETIC_PATH_RULES}
        />
      )}

      {phase === "running" && firstLevel && (
        <ArithmeticPathRunningView
          sessionId={sessionId}
          firstLevel={firstLevel}
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

export default ArithmeticPathGame;
