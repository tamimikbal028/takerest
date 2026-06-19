import { FaExclamationTriangle } from "react-icons/fa";
import { NavLink } from "react-router";

const NotFound = () => {
  return (
    <div className="mx-auto max-w-4xl border px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <FaExclamationTriangle className="mx-auto mb-6 h-16 w-16 text-yellow-500" />
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          404 - Page Not Found
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Sorry, the page you are looking for doesn't exist.
        </p>
        <NavLink
          to="/"
          className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Go back home
        </NavLink>
      </div>
    </div>
  );
};

export default NotFound;

