import { Link } from "react-router-dom";
import type { ArcadeGame } from "@/app/gaming/play/gameCatalog";

interface GameCardProps {
  game: ArcadeGame;
  index: number;
  rank?: number;
}

const GameCard = ({ game, index, rank }: GameCardProps) => {
  return (
    <Link
      to={game.key}
      className="group relative flex flex-col space-y-5 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-300 bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <span className="text-lg font-black italic">
            {(index + 1).toString().padStart(2, "0")}
          </span>
        </div>

        {rank && (
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
              Rank
            </p>
            <p className="text-3xl font-black tracking-tighter text-emerald-600 transition-colors group-hover:text-blue-600">
              #{rank}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="text-3xl leading-tight font-black tracking-tighter text-gray-900 transition-colors group-hover:text-blue-600">
          {game.label}
        </h3>
        <p className="text-sm font-bold text-gray-400 transition-colors group-hover:text-gray-500">
          {game.description}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-8 rounded-full bg-blue-100 transition-colors group-hover:bg-blue-600" />
        <div className="h-1.5 w-1.5 rounded-full bg-blue-100 transition-colors group-hover:bg-blue-600" />
      </div>
    </Link>
  );
};

export default GameCard;
