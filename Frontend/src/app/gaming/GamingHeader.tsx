import { NavLink } from "react-router-dom";

const GamingHeader = () => {
  const tabs = [
    { path: "/gaming", label: "Play", end: true, display: true },
    { path: "/gaming/leaderboard", label: "Leaderboard", display: true },
  ];

  const displayTabs = tabs.filter((tab) => tab.display);

  return (
    <div className="flex justify-start gap-3 overflow-x-auto">
      {displayTabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) =>
            `cursor-pointer rounded-md px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-500 hover:text-black"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};

export default GamingHeader;
