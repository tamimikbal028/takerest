import authRouter from "./auth.routes.js";

const registerRoutes = (app) => {
  // Auth routes
  app.use("/api/v1/auth", authRouter);
};

export default registerRoutes;
