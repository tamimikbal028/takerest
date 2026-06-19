import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authHooks from "@/hooks/useAuth";
import BoxesList from "./BoxesList";
import CreateBoxForm from "./CreateBoxForm";
import SubmitToBox from "./SubmitToBox";
import BoxNavBar from "./BoxNavBar";

const Box = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = authHooks.useUser();

  // Determine active tab based on pathname
  let activeTab: "boxes" | "create" | "submit" = "boxes";
  if (location.pathname.endsWith("/create")) {
    activeTab = "create";
  } else if (location.pathname.endsWith("/submit")) {
    activeTab = "submit";
  }

  // Handle auto-redirection for unauthenticated guest users
  useEffect(() => {
    if (!isAuthenticated) {
      if (location.pathname === "/submit-box") {
        navigate("/submit-box/submit", { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleTabChange = (tab: "boxes" | "create" | "submit") => {
    if (!isAuthenticated && (tab === "boxes" || tab === "create")) {
      navigate("/login");
      return;
    }

    if (tab === "boxes") {
      navigate("/submit-box");
    } else {
      navigate(`/submit-box/${tab}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <BoxNavBar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Tab Content */}
      <div>
        {activeTab === "boxes" && <BoxesList />}
        {activeTab === "create" && <CreateBoxForm />}
        {activeTab === "submit" && <SubmitToBox />}
      </div>
    </div>
  );
};

export default Box;
