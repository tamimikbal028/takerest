import { FaUser } from "react-icons/fa";
import SettingsItem from "@/app/settings/SettingsItem";

const AccountSettings = () => {
  const handleProfileInfo = () => {
    // TODO: Navigate to profile info page
    console.log("Navigate to profile info");
  };

  const handleChangePassword = () => {
    // TODO: Navigate to change password page
    console.log("Navigate to change password");
  };

  const handleEmailPreferences = () => {
    // TODO: Navigate to email preferences
    console.log("Navigate to email preferences");
  };

  const handleDeleteAccount = () => {
    // TODO: Navigate to delete account confirmation
    console.log("Navigate to delete account");
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center space-x-3">
        <FaUser className="text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
      </div>
      <div className="space-y-1 divide-y divide-gray-100">
        <SettingsItem
          label="Profile Information"
          description="Update your personal details"
          action="navigate"
          onNavigate={handleProfileInfo}
        />
        <SettingsItem
          label="Change Password"
          description="Update your password"
          action="navigate"
          onNavigate={handleChangePassword}
        />
        <SettingsItem
          label="Email Preferences"
          description="Manage email settings"
          action="navigate"
          onNavigate={handleEmailPreferences}
        />
        <SettingsItem
          label="Delete Account"
          description="Permanently delete your account"
          action="navigate"
          danger={true}
          onNavigate={handleDeleteAccount}
        />
      </div>
    </div>
  );
};

export default AccountSettings;
