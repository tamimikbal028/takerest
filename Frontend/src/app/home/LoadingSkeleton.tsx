const LoadingSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-400 bg-white p-4 shadow"
        >
          <div className="mb-4 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-300"></div>
              <div className="h-3 w-16 rounded bg-gray-300"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gray-300"></div>
            <div className="h-4 w-3/4 rounded bg-gray-300"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
