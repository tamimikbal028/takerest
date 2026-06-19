import { useState } from "react";
import { Link } from "react-router-dom";
import PageLoader from "@/app/shared/PageLoader";
import gamingHooks from "@/hooks/useGaming";
import { formatPostTime } from "@/utils/dateUtils";
import { arcadeGames } from "@/app/gaming/play/gameCatalog";
import { HiChevronDown } from "react-icons/hi2";
import RewardsBanner from "@/app/shared/Gaming/RewardsBanner";

const Leaderboard = () => {
  const { data, isLoading } = gamingHooks.useGamingLeaderboard();
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  if (isLoading) return <PageLoader />;

  const currentUser = data?.currentUser;

  const toggleGame = (gameKey: string) => {
    setExpandedGame(expandedGame === gameKey ? null : gameKey);
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms === 0) return "--";
    return `${ms.toFixed(1)}s`;
  };

  return (
    <div className="space-y-3">
      <RewardsBanner />

      <div className="space-y-1">
        {arcadeGames.map((game, index) => {
          const entries = data?.leaderboards[game.key] ?? [];
          const currentGameStats = currentUser?.games[game.key];
          const currentGameRank = currentUser?.ranks[game.key] ?? null;
          const isExpanded = expandedGame === game.key;

          return (
            <section
              key={game.key}
              className={`overflow-hidden rounded-3xl border border-gray-300 transition-all duration-300 ${
                isExpanded
                  ? "bg-white shadow-xl shadow-blue-500/5"
                  : "bg-gray-50/50 hover:bg-white hover:shadow-md"
              }`}
            >
              {/* Header / Trigger */}
              <button
                type="button"
                onClick={() => toggleGame(game.key)}
                className="group flex w-full flex-wrap items-center justify-between gap-4 px-2 py-3 text-left sm:px-5 sm:py-5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 text-xl font-black transition-all ${
                      isExpanded
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white text-gray-400 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    }`}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-gray-900 transition-colors group-hover:text-blue-600">
                      {game.label}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400">
                      {entries.length} players ranked
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Your Rank */}
                  {currentUser && (
                    <div className="items-center sm:flex">
                      <p
                        className={`text-2xl font-black tracking-tighter italic ${
                          !currentGameRank
                            ? "hidden text-gray-300 sm:block"
                            : currentGameRank <= 3
                              ? "text-emerald-500"
                              : currentGameRank <= 15
                                ? "text-amber-500"
                                : "text-rose-500"
                        }`}
                      >
                        {currentGameRank ? `#${currentGameRank}` : "Unranked"}
                      </p>
                    </div>
                  )}

                  {/* Play Now Button */}
                  <Link
                    to={`/gaming/play/${game.key}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-5 text-[11px] font-black tracking-widest text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
                  >
                    <span className="hidden sm:block"> PLAY NOW</span>
                    <span className="sm:hidden"> PLAY</span>
                  </Link>

                  {/* Expand Button */}
                  <div
                    className={`rounded-full p-2 transition-all duration-300 ${
                      isExpanded
                        ? "rotate-180 bg-blue-50 text-blue-600"
                        : "text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600"
                    }`}
                  >
                    <HiChevronDown size={20} />
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  isExpanded
                    ? "max-h-3000px border-t border-gray-100 opacity-100"
                    : "max-h-0 overflow-hidden opacity-0"
                }`}
              >
                {isExpanded && (
                  <div className="bg-white">
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                        {[
                          {
                            label: "Your Rank",
                            value: currentGameRank
                              ? `#${currentGameRank}`
                              : "Unranked",
                            bg: "bg-blue-50/50",
                            text: "text-blue-600",
                          },
                          {
                            label: "Weekly High Score",
                            value: currentGameStats?.weeklyBestScore ?? 0,
                            bg: "bg-emerald-50/50",
                            text: "text-emerald-600",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className={`min-w-120px flex-1 rounded-2xl border border-gray-200 p-3 ${stat.bg}`}
                          >
                            <p
                              className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${stat.text}`}
                            >
                              {stat.label}
                            </p>
                            <p className="mt-1 text-xl font-black text-gray-900">
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-[44px_minmax(0,2.5fr)_repeat(2,minmax(52px,1fr))] gap-2 border-b border-gray-100 px-4 py-3 text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase sm:grid-cols-[80px_minmax(0,2.5fr)_repeat(2,minmax(100px,1fr))] sm:gap-3 sm:px-5">
                      <span className="invisible sm:visible">Rank</span>
                      <span>Gaming Name</span>
                      <span>Best</span>
                      <span>Latest</span>
                    </div>

                    {entries.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {entries.map((entry) => {
                          const isMe =
                            entry.profile.id.toString() ===
                            currentUser?.profile.id.toString();

                          return (
                            <div
                              key={`${game.key}-${entry.profile.id}`}
                              className={`grid grid-cols-[44px_minmax(0,2.5fr)_repeat(2,minmax(52px,1fr))] gap-2 px-4 py-3 transition-colors sm:grid-cols-[80px_minmax(0,2.5fr)_repeat(2,minmax(100px,1fr))] sm:gap-3 sm:px-5 ${
                                isMe
                                  ? "border-l-4 border-blue-600 bg-blue-50/80"
                                  : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <div
                                className={`flex items-center text-lg font-black ${isMe ? "text-blue-700" : "text-gray-900"}`}
                              >
                                #{entry.rank}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`truncate font-bold ${isMe ? "text-blue-800" : "text-gray-900"}`}
                                >
                                  {entry.profile.gamerName}
                                </p>
                                <p className="text-[11px] font-medium text-gray-400">
                                  {entry.lastPlayedAt &&
                                    `${formatPostTime(entry.lastPlayedAt)}`}
                                </p>
                              </div>
                              <div className="flex flex-col justify-center">
                                <p className="text-lg leading-none font-black text-blue-600">
                                  {entry.weeklyBestScore}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-gray-400">
                                  {formatDuration(
                                    entry.weeklyBestScoreDuration
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-col justify-center">
                                <p className="leading-none font-medium text-gray-800">
                                  {entry.latestScore}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-gray-400">
                                  {formatDuration(entry.latestScoreDuration)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <h4 className="text-xl font-black text-gray-900">
                          No rankings found for {game.label} this week
                        </h4>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                          Jump in and be the first to take the #1 spot!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
