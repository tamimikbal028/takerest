import type { Box } from "@/types/box.types";
import { Link } from "react-router-dom";

const BoxCard = ({ box }: { box: Box }) => {
  return (
    <Link
      to={`/submit-box/${box.id}`}
      key={box.id}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-400 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex min-h-[90px] flex-col items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-center transition-colors group-hover:bg-blue-100">
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
              box.is_accepting
                ? "border border-green-200 bg-green-100 text-green-700"
                : "border border-red-200 bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${box.is_accepting ? "animate-pulse bg-green-500" : "bg-red-500"}`}
            />
            {box.is_accepting ? "Active" : "Closed"}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold text-gray-900">{box.title}</h3>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          {box.submissions_count}{" "}
          {box.submissions_count <= 1 ? "submission" : "submissions"}
        </span>
      </div>
    </Link>
  );
};

export default BoxCard;
