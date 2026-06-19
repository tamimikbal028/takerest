import { NavLink } from "react-router-dom";
import { FaHome, FaTrophy, FaComments, FaCog, FaBars } from "react-icons/fa";
import authHooks from "@/hooks/useAuth";
import { FEATURE_FLAGS as flags, USER_TYPES } from "@/constants";

interface MobileTopNavbarProps {
  onToggleSidebar: () => void;
}

const MobileTopNavbar = ({ onToggleSidebar }: MobileTopNavbarProps) => {
  const { user } = authHooks.useUser();

  const navItems = [
    {
      to: "/",
      icon: FaHome,
      label: "Home",
      display: flags.HOME,
    },
    {
      to: "/gaming",
      icon: FaTrophy,
      label: "Competition",
      display: flags.GAMING && user?.user_type !== USER_TYPES.TEACHER,
    },
    {
      to: "/open-discussion",
      icon: FaComments,
      label: "Discussion",
      display: flags.OPEN_DISCUSSION,
    },
    {
      to: "/settings",
      icon: FaCog,
      label: "Settings",
      display: flags.SETTINGS,
    },
  ];

  const displayNavItems = navItems.filter((item) => item.display);

  return (
    <nav className="flex h-14 w-full items-center justify-around border-b border-gray-200 bg-white shadow-sm">
      {/* Menu / Hamburger Button to toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        className="flex cursor-pointer flex-col items-center gap-0.5 px-3 py-1 text-gray-500 transition-all hover:text-blue-500 active:scale-95"
        aria-label="Open menu"
      >
        <FaBars className="h-5 w-5" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>

      {displayNavItems.map(({ to, icon: Icon, label }) => {
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive
                  ? "font-semibold text-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileTopNavbar;
