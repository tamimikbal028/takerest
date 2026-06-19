import api from "@/config/axios";
import type {
  ApiResponse,
  ArcadeGameKey,
  ArcadeLeaderboardResponse,
  GamingProfileResponse,
  SubmitArcadeScoreResponse,
  MyGamingStatsResponse,
  SubmitArcadeTurnResponse,
} from "../types";

const getMyProfile = async (): Promise<ApiResponse<GamingProfileResponse>> => {
  const response =
    await api.get<ApiResponse<GamingProfileResponse>>("/gaming/profile");
  return response.data;
};

const createProfile = async (
  gamerName: string
): Promise<ApiResponse<GamingProfileResponse>> => {
  const response = await api.post<ApiResponse<GamingProfileResponse>>(
    "/gaming/profile",
    { gamerName }
  );
  return response.data;
};

const claimDailyXP = async (): Promise<ApiResponse<GamingProfileResponse>> => {
  const response = await api.post<ApiResponse<GamingProfileResponse>>(
    "/gaming/claim-daily"
  );
  return response.data;
};

const getLeaderboard = async (
  limit: number = 5
): Promise<ApiResponse<ArcadeLeaderboardResponse>> => {
  const response = await api.get<ApiResponse<ArcadeLeaderboardResponse>>(
    `/gaming/leaderboard?limit=${limit}`
  );
  return response.data;
};

const submitScore = async (
  sessionId: string,
  answers: any[],
  duration: number
): Promise<ApiResponse<SubmitArcadeScoreResponse>> => {
  const response = await api.post<ApiResponse<SubmitArcadeScoreResponse>>(
    "/gaming/scores",
    { sessionId, answers, duration }
  );
  return response.data;
};

const submitTurn = async (
  sessionId: string,
  answer: any
): Promise<ApiResponse<SubmitArcadeTurnResponse>> => {
  const response = await api.post<ApiResponse<SubmitArcadeTurnResponse>>(
    "/gaming/submit-turn",
    { sessionId, answer }
  );
  return response.data;
};

const startGame = async (
  gameKey: ArcadeGameKey
): Promise<
  ApiResponse<GamingProfileResponse & { sessionId: string; firstQuestion: any; totalQuestions: number }>
> => {
  const response = await api.post<
    ApiResponse<GamingProfileResponse & { sessionId: string; firstQuestion: any; totalQuestions: number }>
  >("/gaming/start-game", { gameKey });
  return response.data;
};

const getMyStats = async (): Promise<ApiResponse<MyGamingStatsResponse>> => {
  const response =
    await api.get<ApiResponse<MyGamingStatsResponse>>("/gaming/my-stats");
  return response.data;
};

const gamingServices = {
  getMyProfile,
  createProfile,
  claimDailyXP,
  getLeaderboard,
  submitScore,
  submitTurn,
  startGame,
  getMyStats,
};

export default gamingServices;
