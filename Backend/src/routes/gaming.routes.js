import express from "express";
import gamingControllers from "../controllers/gaming.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(verifyJWT);

router.route("/profile")
  .get(gamingControllers.getMyProfile)
  .post(gamingControllers.createMyProfile);

router.post("/claim-daily", gamingControllers.claimDailyXP);
router.get("/leaderboard", gamingControllers.getArcadeLeaderboard);
router.get("/my-stats", gamingControllers.getMyGamingStats);
router.post("/start-game", gamingControllers.startArcadeGame);
router.post("/submit-turn", gamingControllers.submitArcadeTurn);
router.post("/scores", gamingControllers.submitArcadeScore);

export default router;
