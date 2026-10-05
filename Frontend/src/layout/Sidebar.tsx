import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, User } from "lucide-react";
import authHooks from "@/hooks/useAuth";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = authHooks.useUser();

  const navigationItems = [
    {
      icon: LayoutDashboard,
      label: "Home",
      path: "/",
      active: location.pathname === "/",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      active: location.pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-2 py-1"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <span className="text-xl font-extrabold tracking-tight">TR</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-gray-900">
              Take Rest
            </span>
            <span className="text-xs font-medium text-gray-400">
              Workspace
            </span>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  item.active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    item.active ? "text-white" : "text-gray-400"
                  }`}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      {isAuthenticated && user && (
        <div className="border-t border-gray-100 pt-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-gray-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-bold text-gray-900">
                {user.full_name}
              </span>
              <span className="truncate text-[10px] text-gray-400">
                @{user.user_name}
              </span>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
