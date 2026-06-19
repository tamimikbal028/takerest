interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  className?: string;
  label?: string;
  loadingLabel?: string;
  type?: "button" | "submit" | "reset";
}

const LoadMoreButton = ({
  onClick,
  isLoading,
  className = "inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-50",
  label = "Load More",
  loadingLabel = "Loading...",
  type = "button",
}: LoadMoreButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent"
          />
          <span>{loadingLabel}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
};

export default LoadMoreButton;
