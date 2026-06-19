import { FaSync } from "react-icons/fa";

const RefreshPage = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center text-3xl">
      <button
        onClick={() => window.location.reload()}
        className="inline-flex cursor-pointer items-center gap-3 rounded-md bg-blue-300 px-10 py-5 transition-colors hover:bg-blue-200"
      >
        <FaSync /> Refresh Page
      </button>
    </div>
  );
};

export default RefreshPage;

