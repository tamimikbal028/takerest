import gamingServices from "../services/gaming.service.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getMyProfile = AsyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { profile, meta } = await gamingServices.getProfileByUserId(userId);

  if (!profile) {
    throw new ApiError(404, "Gaming profile not found");
  }

  const responseData = { profile, meta };
  const message = "Gaming profile retrieved successfully";
  const apiResponse = new ApiResponse(200, responseData, message);

  return res.status(200).json(apiResponse);
});

const createMyProfile = AsyncHandler(async (req, res) => {
  const { gamerName } = req.body;
  const userId = req.user.id;

  if (!gamerName) {
    throw new ApiError(400, "Gamer name is required");
  }

  const { profile, meta } = await gamingServices.createProfile(
    userId,
    gamerName
  );

  const responseData = { profile, meta };
  const responseMessage = "Gaming profile created successfully";
  const apiResponse = new ApiResponse(201, responseData, responseMessage);

  return res.status(201).json(apiResponse);
});

const claimDailyXP = AsyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { profile, meta } = await gamingServices.claimDailyXP(userId);

  const responseData = { profile, meta };
  const responseMessage = "XP claimed successfully";
  const apiResponse = new ApiResponse(200, responseData, responseMessage);

  return res.status(200).json(apiResponse);
});

const submitArcadeScore = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, answers, duration } = req.body;

  if (!sessionId) {
    throw new ApiError(400, "Session ID is required");
  }

  const result = await gamingServices.submitArcadeScore(
    userId,
    sessionId,
    answers,
    duration
  );

  const apiResponse = new ApiResponse(
    200,
    result,
    "Score submitted successfully"
  );

  return res.status(200).json(apiResponse);
});

const submitArcadeTurn = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId, answer } = req.body;

  if (!sessionId) {
    throw new ApiError(400, "Session ID is required");
  }

  const result = await gamingServices.submitArcadeTurn(
    userId,
    sessionId,
    answer
  );

  const apiResponse = new ApiResponse(
    200,
    result,
    "Turn submitted successfully"
  );

  return res.status(200).json(apiResponse);
});

const startArcadeGame = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { gameKey } = req.body;

  if (!gameKey) {
    throw new ApiError(400, "Game key is required");
  }

  const result = await gamingServices.startArcadeGame(userId, gameKey);

  const apiResponse = new ApiResponse(
    200,
    result,
    "Game session started. Token deducted."
  );

  return res.status(200).json(apiResponse);
});

const getArcadeLeaderboard = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = Number.parseInt(req.query.limit, 10) || 5;

  const data = await gamingServices.getArcadeLeaderboard(userId, limit);
  const apiResponse = new ApiResponse(
    200,
    data,
    "Leaderboard retrieved successfully"
  );

  return res.status(200).json(apiResponse);
});
const getMyGamingStats = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data = await gamingServices.getMyGamingStats(userId);
  const apiResponse = new ApiResponse(
    200,
    data,
    "My gaming stats and ranks retrieved successfully"
  );
  return res.status(200).json(apiResponse);
});

const gamingProfileControllers = {
  getMyProfile,
  createMyProfile,
  claimDailyXP,
  startArcadeGame,
  submitArcadeScore,
  submitArcadeTurn,
  getArcadeLeaderboard,
  getMyGamingStats,
};

export default gamingProfileControllers;
