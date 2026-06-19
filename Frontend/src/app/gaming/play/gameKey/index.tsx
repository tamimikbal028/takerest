import { useParams, useNavigate } from "react-router-dom";
import gamingHooks from "@/hooks/useGaming";
import PageLoader from "@/app/shared/PageLoader";
import { arcadeGames } from "@/app/gaming/play/gameCatalog";
import type { ArcadeGameKey } from "@/types";
import { type ComponentType } from "react";
import MathSprintGame from "@/app/gaming/play/games/math-sprint/MathSprintGame";
import ArenaHeader from "@/app/shared/Gaming/ArenaHeader";
import GridHunterGame from "@/app/gaming/play/games/grid-hunter/GridHunterGame";
import SpeedEquateGame from "@/app/gaming/play/games/speed-equate/SpeedEquateGame";
import LogicalDeductionGame from "@/app/gaming/play/games/logical-deduction/LogicalDeductionGame";
import LogicPathGame from "../games/logic-path/LogicPathGame";
import OperatorGridGame from "../games/operator-grid/OperatorGridGame";
import ArithmeticPathGame from "../games/arithmetic-path/ArithmeticPathGame";
import LogicalDeduction2Game from "../games/logical-deduction-2/LogicalDeduction2Game";
import SumMatrixGame from "../games/sum-matrix/SumMatrixGame";

const arcadeGameComponents: Record<ArcadeGameKey, ComponentType> = {
  "math-sprint": MathSprintGame,
  "grid-hunter": GridHunterGame,
  "speed-equate": SpeedEquateGame,
  "logical-deduction": LogicalDeductionGame,
  "logic-path": LogicPathGame,
  "operator-grid": OperatorGridGame,
  "arithmetic-path": ArithmeticPathGame,
  "logical-deduction-2": LogicalDeduction2Game,
  "sum-matrix": SumMatrixGame,
};

const GameArena = () => {
  const { gameKey } = useParams<{ gameKey: string }>();
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading } =
    gamingHooks.useGamingStats();
  const { data: profileData, isLoading: isProfileLoading } =
    gamingHooks.useGamingProfile();

  if (isStatsLoading || isProfileLoading) return <PageLoader />;

  const currentUser = stats;
  const game = arcadeGames.find((g) => g.key === gameKey);

  if (!game || !gameKey) {
    return (
      <div className="flex flex-col items-center justify-center border border-gray-100 bg-white p-5 py-20 shadow-sm">
        <h2 className="text-2xl font-bold">Game not found</h2>
        <button
          onClick={() => navigate("..")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Arcade
        </button>
      </div>
    );
  }

  const activeStats = currentUser?.games[gameKey as ArcadeGameKey] ?? {
    weeklyBestScore: 0,
    weeklyPlaysCount: 0,
  };

  const ActiveGameComponent = arcadeGameComponents[gameKey as ArcadeGameKey];

  return (
    <div className="space-y-3">
      <ArenaHeader
        label={game.label}
        best={activeStats.weeklyBestScore}
        tokens={profileData?.profile?.tokens ?? 0}
      />

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <ActiveGameComponent />
      </div>
    </div>
  );
};

export default GameArena;
