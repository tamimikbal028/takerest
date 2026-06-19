import type { ReactNode } from "react";

interface ArcadeContainerProps {
  children: ReactNode;
}

const ArcadeContainer = ({ children }: ArcadeContainerProps) => {
  return (
    <div
      id="arcade-container"
      className="flex flex-col justify-center rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-10"
    >
      {children}
    </div>
  );
};

export default ArcadeContainer;

