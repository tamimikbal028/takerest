interface ArcadeTimerBarProps {
  timeLeft: number;
  timeLimit: number;
  dangerThreshold?: number;
  isHidden?: boolean;
}

const ArcadeTimerBar = ({
  timeLeft,
  timeLimit,
  dangerThreshold = 2,
  isHidden = false,
}: ArcadeTimerBarProps) => {
  const percentage = (timeLeft / timeLimit) * 100;
  const isDanger = timeLeft < dangerThreshold;

  return (
    <div
      className={`transition-all duration-500 ${isHidden ? "invisible opacity-0" : "visible opacity-100"}`}
    >
      <div className="mb-3 flex items-center justify-end px-1">
        <p
          className={`text-2xl font-black tracking-tighter italic tabular-nums transition-colors ${
            isDanger ? "animate-pulse text-rose-600" : "text-gray-900"
          }`}
        >
          {Math.max(0, timeLeft).toFixed(1)}
          <span className="ml-0.5 text-sm not-italic opacity-50">s</span>
        </p>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ring-gray-200/50">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            isDanger
              ? "bg-linear-to-r from-rose-500 to-red-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              : "bg-linear-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
          }`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        />

        {/* Subtle glass effect overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/20 to-transparent" />
      </div>
    </div>
  );
};

export default ArcadeTimerBar;

