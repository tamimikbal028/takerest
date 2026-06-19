import { Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { routes, getRouteByPath } from "@/routes/routeConfig";
import PageLoader from "@/app/shared/PageLoader";

const MainContent = () => {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = getRouteByPath(location.pathname);
    if (currentRoute?.title) {
      document.title = currentRoute.title;
    }
  }, [location.pathname]);

  const displayRoutes = routes.filter((route) => route.display);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {displayRoutes.map((route, idx) => {
          const { path, Component, requireAuth } = route;

          return (
            <Route
              key={idx}
              path={path}
              element={
                <ProtectedRoute requireAuth={requireAuth}>
                  <Component />
                </ProtectedRoute>
              }
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default MainContent;

