interface ArcadeLobbyHeaderProps {
  gameCount: number;
}

const ArcadeLobbyHeader = ({ gameCount }: ArcadeLobbyHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-2">
      <h2 className="text-2xl font-black tracking-tight text-gray-900">
        Active Playground
      </h2>
      <div className="ml-8 h-px grow bg-linear-to-r from-gray-100 to-transparent" />
      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
        {gameCount} Games Available
      </p>
    </div>
  );
};

export default ArcadeLobbyHeader;
