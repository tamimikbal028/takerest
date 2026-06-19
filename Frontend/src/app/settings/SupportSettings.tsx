import { FaQuestionCircle } from "react-icons/fa";
import SettingsItem from "@/app/settings/SettingsItem";

const SupportSettings = () => {
  const handleNavigation = (path: string) => {
    console.log(`Navigating to ${path}`);
    // In a real app, this would handle navigation
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center space-x-3">
        <FaQuestionCircle className="text-yellow-600" />
        <h2 className="text-lg font-semibold text-gray-900">Support & Help</h2>
      </div>
      <div className="space-y-1 divide-y divide-gray-100">
        <SettingsItem
          label="Help Center"
          description="Browse articles and tutorials"
          action="navigate"
          onNavigate={() => handleNavigation("/help")}
        />
        <SettingsItem
          label="Contact Support"
          description="Get help from our support team"
          action="navigate"
          onNavigate={() => handleNavigation("/support")}
        />
        <SettingsItem
          label="Report a Bug"
          description="Let us know about any issues you've encountered"
          action="navigate"
          onNavigate={() => handleNavigation("/report-bug")}
        />
        <SettingsItem
          label="Feature Request"
          description="Suggest new features or improvements"
          action="navigate"
          onNavigate={() => handleNavigation("/feature-request")}
        />
        <SettingsItem
          label="Terms of Service"
          description="Read our terms and conditions"
          action="navigate"
          onNavigate={() => handleNavigation("/terms")}
        />
        <SettingsItem
          label="Privacy Policy"
          description="Learn how we protect your data"
          action="navigate"
          onNavigate={() => handleNavigation("/privacy")}
        />
        <SettingsItem
          label="About"
          description="App version and information"
          action="navigate"
          onNavigate={() => handleNavigation("/about")}
        />
      </div>
    </div>
  );
};

export default SupportSettings;
