import authRouter from "./auth.routes.js";
import gamingRouter from "./gaming.routes.js";
import boxRouter from "./box.routes.js";
import quickShareRouter from "./quickShare.routes.js";

import { FEATURE_FLAGS } from "../constants/featureFlags.js";

const registerRoutes = (app) => {
  // 1. Always Registered Routes
  app.use("/api/v1/auth", authRouter);
  FEATURE_FLAGS.QUICK_SHARE && app.use("/api/v1/quick-share", quickShareRouter);

  // 3. Other Modular Features (Controlled by their respective flags)
  FEATURE_FLAGS.GAMING && app.use("/api/v1/gaming", gamingRouter);
  FEATURE_FLAGS.BOX && app.use("/api/v1/boxes", boxRouter);
};

export default registerRoutes;
