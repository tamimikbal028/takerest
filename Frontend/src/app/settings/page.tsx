import { FaSignOutAlt } from "react-icons/fa";
import authHooks from "@/hooks/useAuth";
import ChangePasswordCard from "@/app/settings/ChangePasswordCard";

const Settings = () => {
  const { mutate: logout, isPending: isLoggingOut } = authHooks.useLogout();

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500">
            Manage your account settings and credentials.
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Change Password Section */}
      <ChangePasswordCard />
    </div>
  );
};

export default Settings;
