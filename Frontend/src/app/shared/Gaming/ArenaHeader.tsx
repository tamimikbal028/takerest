import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";

interface ArenaHeaderProps {
  label: string;
  best: number;
  tokens: number;
}

const ArenaHeader = ({ label, best, tokens }: ArenaHeaderProps) => {
  const navigate = useNavigate();

  const stats = [
    {
      label: "Weekly Best",
      value: best,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Tokens",
      value: tokens,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95"
          title="Back to Arcade"
        >
          <HiArrowLeft size={24} />
        </button>
        <div>
          <h3 className="text-3xl font-black text-gray-900">{label}</h3>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-gray-300 ${stat.bg} px-5 py-2 text-center`}
          >
            <p
              className={`text-[10px] font-black tracking-widest ${stat.text} uppercase`}
            >
              {stat.label}
            </p>
            <p className="text-xl font-black text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArenaHeader;

