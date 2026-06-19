import { NavLink, useLocation } from "react-router-dom";
import { FaCog, FaTrophy, FaUpload, FaShareAlt } from "react-icons/fa";
import authHooks from "@/hooks/useAuth";
import { FEATURE_FLAGS as flags, USER_TYPES } from "@/constants";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = authHooks.useUser();

  const navigationItems = [
    {
      icon: FaTrophy,
      display: flags.GAMING && user?.user_type !== USER_TYPES.TEACHER,
      label: "Gaming",
      path: "/gaming",
      active: location.pathname.startsWith("/gaming"),
    },
    {
      icon: FaUpload,
      display: flags.BOX,
      label: "Submit Box",
      path: "/submit-box",
      active: location.pathname.startsWith("/submit-box"),
    },
    {
      icon: FaShareAlt,
      display: flags.QUICK_SHARE,
      label: "Quick Share",
      path: "/quick-share",
      active: location.pathname.startsWith("/quick-share"),
    },
    {
      icon: FaCog,
      display: flags.SETTINGS,
      label: "Settings",
      path: "/settings",
      active: location.pathname.startsWith("/settings"),
    },
  ];

  const displayNavItems = navigationItems.filter((item) => item.display);

  return (
    <div className="flex h-full flex-col space-y-1 p-3">
      {/* Logo/Brand - Click to go Home */}
      <NavLink
        to="/"
        onClick={onClose}
        className="flex items-center gap-3 border-b border-gray-300 px-2 pb-3"
      >
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-blue-400 to-blue-700 shadow-md">
          <span className="text-2xl font-bold text-white">TR</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900">Take Rest</span>
          <span className="text-sm text-gray-500">Connect & Play</span>
        </div>
      </NavLink>

      {/* Navigation Menu */}
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {displayNavItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path || "#"}
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 ${
                item.active
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center">
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    item.active
                      ? "text-blue-600"
                      : "text-gray-500 group-hover:text-gray-900"
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
