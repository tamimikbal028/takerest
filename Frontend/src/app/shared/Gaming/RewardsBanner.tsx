import { HiTrophy } from "react-icons/hi2";

const RewardsBanner = () => {
  const display = false;

  if (!display) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/50 p-3 shadow-sm">
      <div className="relative z-10 flex items-center gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <HiTrophy size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-blue-900">
            Weekly XP Rewards!
          </h3>
          <p className="text-sm leading-relaxed font-bold text-blue-700/80">
            Every week, the top 3 players in each game will receive special XP
            rewards:{" "}
            <span className="font-extrabold text-blue-900">
              200, 100, and 50 XP
            </span>{" "}
            respectively.
          </p>
        </div>
      </div>
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
    </div>
  );
};

export default RewardsBanner;

