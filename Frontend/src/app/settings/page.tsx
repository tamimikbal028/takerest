import { FaSignOutAlt } from "react-icons/fa";
import authHooks from "@/hooks/useAuth";
import ChangePasswordCard from "@/app/settings/ChangePasswordCard";
import AccountSettings from "@/app/settings/AccountSettings";
import PrivacySettings from "@/app/settings/PrivacySettings";
import NotificationSettings from "@/app/settings/NotificationSettings";
import AppearanceSettings from "@/app/settings/AppearanceSettings";
import SupportSettings from "@/app/settings/SupportSettings";

const Settings = () => {
  const { mutate: logout, isPending: isLoggingOut } = authHooks.useLogout();

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Logout Section */}
      <div className="w-fit rounded-lg bg-white p-3 shadow-sm">
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="flex cursor-pointer items-center space-x-3 rounded-md border border-red-600 px-3 py-2 text-red-600 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
          <FaSignOutAlt />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* Change Password Section */}
      <div className="mt-5">
        <ChangePasswordCard />
      </div>

      <div className="hidden space-y-5">
        <AccountSettings />
        <PrivacySettings />
        <NotificationSettings />
        <AppearanceSettings />
        <SupportSettings />
      </div>
    </>
  );
};

export default Settings;
