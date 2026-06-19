import React from "react";
// import ArcadeTimerBar from "./ArcadeTimerBar";

interface ArcadeStat {
  label: string;
  value: string | number;
  color?: string;
}

interface ArcadeRunningLayoutProps {
  children: React.ReactNode;
  timeLeft: number;
  timeLimit: number;
  leftStats: ArcadeStat[];
  rightStats: ArcadeStat[];
  instruction?: string;
  isHidden?: boolean;
}

const ArcadeRunningLayout = ({
  children,
  timeLeft,
  timeLimit,
  leftStats,
  rightStats,
  instruction,
  isHidden = false,
}: ArcadeRunningLayoutProps) => {
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex flex-col flex-wrap items-center justify-between gap-y-2 px-2 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase md:flex-row">
        {/* Left Stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {leftStats.map((stat, idx) => (
            <div key={idx}>
              {stat.label}:{" "}
              <span className={stat.color || "text-gray-900"}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Right Stats */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {rightStats.map((stat, idx) => (
            <div key={idx}>
              {stat.label}:{" "}
              <span className={stat.color || "text-blue-600"}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {instruction && (
        <div className="text-center">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase italic">
            {instruction}
          </p>
        </div>
      )}

      <div className="relative">
        {/* Main Content Card - Simple & Clean */}
        <div className="relative overflow-hidden rounded-4xl border-t border-gray-500 bg-white p-5 pb-7 shadow-sm">
          {/* Floating Timer Badge */}
          {!isHidden && (
            <div
              className={`text- absolute top-4 right-4 z-20 flex items-center rounded-full border px-2.5 py-0.5 font-bold shadow-xs backdrop-blur-xs transition-all ${
                timeLeft < 1.5
                  ? "animate-pulse border-rose-500 bg-rose-50/90 text-rose-600"
                  : "border-gray-500 bg-white/95 text-gray-700"
              }`}
            >
              <span className="font-mono tabular-nums">
                {Math.max(0, timeLeft).toFixed(1)}s
              </span>
            </div>
          )}

          <div className="relative z-10 flex w-full flex-col items-center">
            {children}
          </div>

          {/* Integrated border-hugging progress bar at the bottom of the card */}
          {!isHidden && (
            <div className="absolute right-0 bottom-0 left-0 h-1.5 bg-gray-50">
              <div
                className={`h-full transition-all duration-100 ease-linear ${
                  timeLeft < 1.5
                    ? "bg-linear-to-r from-rose-500 to-red-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "bg-linear-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                }`}
                style={{
                  width: `${Math.max(0, (timeLeft / timeLimit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* <div>
        <ArcadeTimerBar
          timeLeft={timeLeft}
          timeLimit={timeLimit}
          dangerThreshold={1.5}
          isHidden={isHidden}
        />
      </div> */}
    </div>
  );
};

export default ArcadeRunningLayout;
