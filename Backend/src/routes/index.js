import authRouter from "./auth.routes.js";
import trackerRouter from "./tracker.routes.js";

const registerRoutes = (app) => {
  // 1. Auth routes
  app.use("/api/v1/auth", authRouter);

  // 2. 24-Hour Day Tracker routes
  app.use("/api/v1/tracker", trackerRouter);
};

export default registerRoutes;
