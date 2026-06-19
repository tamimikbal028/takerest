
import { FaExclamationTriangle } from "react-icons/fa";

interface GroupErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const GroupErrorState = ({
  message = "Something went wrong while loading groups.",
  onRetry,
}: GroupErrorStateProps) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <FaExclamationTriangle size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">
        Error Loading Groups
      </h3>
      <p className="mb-6 text-sm font-medium text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default GroupErrorState;

