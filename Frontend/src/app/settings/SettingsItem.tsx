import { FaToggleOn, FaToggleOff, FaChevronRight } from "react-icons/fa";

interface SettingsItemProps {
  label: string;
  description?: string;
  action: "toggle" | "navigate" | "select";
  value?: boolean | string;
  options?: { value: string; label: string }[];
  danger?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onSelect?: (value: string) => void;
}

const SettingsItem = ({
  label,
  description,
  action,
  value,
  options,
  danger = false,
  onToggle,
  onNavigate,
  onSelect,
}: SettingsItemProps) => {
  const renderAction = () => {
    if (action === "toggle" && typeof value === "boolean") {
      return (
        <button onClick={onToggle}>
          {value ? (
            <FaToggleOn className="h-6 w-6 text-green-500" />
          ) : (
            <FaToggleOff className="h-6 w-6 text-gray-400" />
          )}
        </button>
      );
    }

    if (action === "select" && options && typeof value === "string") {
      return (
        <select
          value={value}
          onChange={(e) => onSelect?.(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (action === "navigate") {
      return (
        <button onClick={onNavigate}>
          <FaChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h3
          className={`font-medium ${danger ? "text-red-600" : "text-gray-900"}`}
        >
          {label}
        </h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="ml-4">{renderAction()}</div>
    </div>
  );
};

export default SettingsItem;
