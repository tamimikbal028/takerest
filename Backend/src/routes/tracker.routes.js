import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import trackerControllers from "../controllers/tracker.controller.js";

const trackerRouter = Router();

// All tracker routes require authentication
trackerRouter.use(verifyJWT);

// 1. Categories
trackerRouter
  .route("/categories")
  .get(trackerControllers.getCategories)
  .post(trackerControllers.createCategory);

trackerRouter
  .route("/categories/:id")
  .put(trackerControllers.updateCategory)
  .delete(trackerControllers.deleteCategory);

// 2. Activities
trackerRouter.route("/activities").post(trackerControllers.createActivity);

trackerRouter
  .route("/activities/:id")
  .put(trackerControllers.updateActivity)
  .delete(trackerControllers.deleteActivity);

// 3. Continuous Active Timer
trackerRouter.route("/timer/active").get(trackerControllers.getActiveTimer);
trackerRouter.route("/timer/save-chunk").post(trackerControllers.saveChunk);
trackerRouter.route("/timer/switch").post(trackerControllers.switchTimer);

// 4. Daily Summary & Logs
trackerRouter.route("/summary").get(trackerControllers.getTodaySummary);
trackerRouter.route("/logs/:id").delete(trackerControllers.deleteTimeLog);

export default trackerRouter;
