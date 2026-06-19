import { Routes, Route, Navigate } from "react-router-dom";
import GamingHeader from "@/app/gaming/GamingHeader";
import PlayPage from "@/app/gaming/play/index";
import Leaderboard from "@/app/gaming/leaderboard/index";
import CreateGamingProfile from "@/app/gaming/create-profile/index";
import GameArena from "@/app/gaming/play/gameKey";
import PageLoader from "@/app/shared/PageLoader";
import gamingHooks from "@/hooks/useGaming";
import authHooks from "@/hooks/useAuth";
import { USER_TYPES } from "@/constants";

const Gaming = () => {
  const { user } = authHooks.useUser();
  const { isLoading, error } = gamingHooks.useGamingProfile();

  if (user?.user_type === USER_TYPES.TEACHER) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) return <PageLoader />;

  const hasNoProfile = error?.response?.status === 404;

  if (hasNoProfile) {
    return <CreateGamingProfile />;
  }

  return (
    <>
      <GamingHeader />
      <Routes>
        <Route index element={<PlayPage />} />
        <Route path="play" element={<Navigate to="/gaming" replace />} />
        <Route path="play/:gameKey" element={<GameArena />} />
        <Route path="leaderboard" element={<Leaderboard />} />

        {/* Redirect to practice play if no route matches */}
        <Route path="*" element={<Navigate to="/gaming" replace />} />
      </Routes>
    </>
  );
};

export default Gaming;
