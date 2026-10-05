import { NavLink } from "react-router-dom";
import { Menu, LayoutDashboard, Settings } from "lucide-react";

interface MobileTopNavbarProps {
  onToggleSidebar: () => void;
}

const MobileTopNavbar = ({ onToggleSidebar }: MobileTopNavbarProps) => {
  const navItems = [
    {
      to: "/",
      icon: LayoutDashboard,
      label: "Home",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <nav className="flex h-14 w-full items-center justify-around border-b border-gray-100 bg-white/95 px-1 shadow-xs backdrop-blur-md">
      {/* Menu / Hamburger Button */}
      <button
        onClick={onToggleSidebar}
        className="flex cursor-pointer flex-col items-center gap-0.5 px-2 py-1 text-gray-500 transition-all hover:text-blue-600 active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>

      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
              isActive
                ? "font-bold text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`
          }
        >
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileTopNavbar;
