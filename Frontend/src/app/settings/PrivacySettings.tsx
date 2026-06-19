import { useState } from "react";
import { FaLock } from "react-icons/fa";
import SettingsItem from "@/app/settings/SettingsItem";

const PrivacySettings = () => {
  // TODO: Replace with API data
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public" as "public" | "friends" | "private",
    showEmail: false,
    showPhone: false,
    allowMessagesFromStranger: true,
  });

  const handlePrivacyToggle = (key: keyof typeof privacy) => {
    if (key === "profileVisibility") return;
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProfileVisibilityChange = (value: string) => {
    setPrivacy((prev) => ({
      ...prev,
      profileVisibility: value as "public" | "friends" | "private",
    }));
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center space-x-3">
        <FaLock className="text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Privacy & Security
        </h2>
      </div>
      <div className="space-y-1 divide-y divide-gray-100">
        <SettingsItem
          label="Profile Visibility"
          description="Who can see your profile"
          action="select"
          value={privacy.profileVisibility}
          options={[
            { value: "public", label: "Public" },
            { value: "friends", label: "Friends Only" },
            { value: "private", label: "Private" },
          ]}
          onSelect={handleProfileVisibilityChange}
        />
        <SettingsItem
          label="Show Email"
          description="Display email on your profile"
          action="toggle"
          value={privacy.showEmail}
          onToggle={() => handlePrivacyToggle("showEmail")}
        />
        <SettingsItem
          label="Show Phone"
          description="Display phone number on your profile"
          action="toggle"
          value={privacy.showPhone}
          onToggle={() => handlePrivacyToggle("showPhone")}
        />
        <SettingsItem
          label="Allow Messages from Strangers"
          description="Receive messages from non-friends"
          action="toggle"
          value={privacy.allowMessagesFromStranger}
          onToggle={() => handlePrivacyToggle("allowMessagesFromStranger")}
        />
      </div>
    </div>
  );
};

export default PrivacySettings;
