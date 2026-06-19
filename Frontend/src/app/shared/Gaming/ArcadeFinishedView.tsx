import ArcadePlayButton from "./ArcadePlayButton";

interface ArcadeFinishedViewProps {
  score: number;
  onPlayAgain: () => void;
  isPreparing: boolean;
  isSubmitting: boolean;
}

const ArcadeFinishedView = ({
  score,
  onPlayAgain,
  isPreparing,
  isSubmitting,
}: ArcadeFinishedViewProps) => {
  return (
    <div className="animate-in slide-in-from-bottom-5 text-center duration-500 sm:text-left">
      <div className="rounded-3xl bg-white p-10 shadow-xl ring-1 shadow-blue-500/5 ring-gray-100">
        <p className="text-xs font-black tracking-[0.2em] text-emerald-600 uppercase">
          Game Finished
        </p>
        <h4 className="mt-2 text-4xl font-black text-gray-900 sm:text-6xl">
          Score: {Math.max(0, score)}
        </h4>
        <p className="mt-4 text-sm leading-relaxed font-bold text-gray-500">
          Great session! Your score has been recorded. Your leaderboard standing
          will be updated shortly.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4 sm:justify-start">
        <ArcadePlayButton
          onAction={onPlayAgain}
          isLoading={isPreparing}
          label="PLAY AGAIN"
        />
        <div className="flex items-center rounded-2xl border border-emerald-500 bg-white px-5 py-5 text-sm font-black tracking-widest text-emerald-600">
          {isSubmitting ? "Syncing stats..." : "Leaderboard Updated"}
        </div>
      </div>
    </div>
  );
};

export default ArcadeFinishedView;

