import { FaBox, FaPlus, FaUpload } from "react-icons/fa";

interface BoxNavBarProps {
  activeTab: "boxes" | "create" | "submit";
  setActiveTab: (activeTab: "boxes" | "create" | "submit") => void;
}

const BoxNavBar = ({ activeTab, setActiveTab }: BoxNavBarProps) => {
  const tabs = [
    {
      id: "boxes",
      label: "Boxes",
      icon: FaBox,
    },
    {
      id: "create",
      label: "Create Box",
      icon: FaPlus,
    },
    {
      id: "submit",
      label: "Submit",
      icon: FaUpload,
    },
  ] as const;

  return (
    <div className="bg-blue-50 shadow-sm">
      <nav className="flex divide-x divide-gray-200" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors hover:bg-gray-50 focus:z-10 ${
              activeTab === tab.id
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BoxNavBar;
