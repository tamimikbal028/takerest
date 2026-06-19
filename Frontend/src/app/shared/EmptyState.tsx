import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string | ReactNode; // Emoji or icon
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "md" | "lg";
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) => {
  const sizeClasses = {
    sm: {
      container: "p-6",
      icon: "text-4xl mb-2",
      title: "text-base font-semibold",
      description: "text-sm",
    },
    md: {
      container: "p-8",
      icon: "text-6xl mb-4",
      title: "text-xl font-semibold",
      description: "text-base",
    },
    lg: {
      container: "p-12",
      icon: "text-7xl mb-4 ",
      title: "text-2xl font-semibold",
      description: "text-lg",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-white text-center shadow-sm ${classes.container}`}
    >
      <div className={classes.icon}>{icon}</div>
      <h3 className={`text-gray-900 ${classes.title}`}>{title}</h3>
      {description && (
        <p className={`mt-2 text-gray-600 ${classes.description}`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

