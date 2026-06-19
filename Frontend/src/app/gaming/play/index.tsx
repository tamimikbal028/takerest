import PageLoader from "@/app/shared/PageLoader";
import gamingHooks from "@/hooks/useGaming";
import RewardsBanner from "@/app/shared/Gaming/RewardsBanner";
import ArcadeLobbyHeader from "@/app/gaming/play/ArcadeLobbyHeader";
import GameCard from "@/app/gaming/play/GameCard";
import { arcadeGames } from "@/app/gaming/play/gameCatalog";

const PlayPage = () => {
  const { data: stats, isLoading: isStatsLoading } =
    gamingHooks.useGamingStats();

  if (isStatsLoading) return <PageLoader />;

  const currentUser = stats;
  const gamesList = arcadeGames;

  return (
    <>
      <RewardsBanner />

      <ArcadeLobbyHeader gameCount={gamesList.length} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {gamesList.map((game, index) => (
          <GameCard
            key={game.key}
            game={game}
            index={index}
            rank={currentUser?.ranks[game.key] ?? undefined}
          />
        ))}
      </div>
    </>
  );
};

export default PlayPage;
