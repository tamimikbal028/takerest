import { HiExclamationTriangle } from "react-icons/hi2";

interface ErrorStateProps {
  message?: string;
  description?: string;
}

const ErrorState = ({
  message = "Something went wrong",
  description = "Please try refreshing the page",
}: ErrorStateProps) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <HiExclamationTriangle className="h-6 w-6 text-red-600" />
      </div>
      <p className="font-semibold text-red-800">{message}</p>
      <p className="mt-1 text-sm text-red-600">{description}</p>
    </div>
  );
};

export default ErrorState;

