import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";
import MainContent from "@/layout/MainContent";
import authHooks from "@/hooks/useAuth";
import { AUTH_KEYS } from "@/constants";
import MobileTopNavbar from "@/layout/MobileTopNavbar";
import AuthLoading from "@/app/shared/LoadingSkeleton/AuthLoading";

const App = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { isCheckingAuth, isAuthenticated } = authHooks.useUser();

  // Global logout event listener
  // Axios interceptor fires this when all tokens expire
  useEffect(() => {
    const handleLogout = () => {
      console.log("Global logout event received");
      // Clear user data in cache
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [queryClient]);

  if (isCheckingAuth) {
    return <AuthLoading />;
  }

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (!isAuthenticated && isAuthPage) {
    return (
      <div className="flex w-full items-center justify-center bg-gray-50 lg:h-screen">
        <MainContent />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden h-full w-64 shrink-0 overflow-y-auto bg-gray-50 lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 flex transition-all duration-300 lg:hidden ${
          isMobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`relative z-50 flex h-full w-72 max-w-xs flex-col bg-white shadow-xl transition-transform duration-300 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Top Navbar (Header) */}
        <div className="z-40 lg:hidden">
          <MobileTopNavbar
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-0">
          <div className="mx-auto w-full py-3 max-w-[750px] space-y-5">
            <MainContent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
