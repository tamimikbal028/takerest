import ArcadePlayButton from "./ArcadePlayButton";

interface ArcadeIdleViewProps {
  onStart: () => void;
  isPreparing: boolean;
  rulesText: string;
}

const ArcadeIdleView = ({
  onStart,
  isPreparing,
  rulesText,
}: ArcadeIdleViewProps) => {
  // Split the rules text by periods and filter out empty strings
  const rules = rulesText
    .split("|||")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center">
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <li key={index} className="flex items-start gap-3 text-left">
              <span className="mt-0.5 shrink-0 text-xs font-black text-blue-600 italic">
                {index + 1}.
              </span>
              <span className="text-sm leading-relaxed font-bold text-gray-500">
                {rule}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <ArcadePlayButton
          onAction={onStart}
          isLoading={isPreparing}
          label="PLAY NOW"
        />
      </div>
    </div>
  );
};

export default ArcadeIdleView;

