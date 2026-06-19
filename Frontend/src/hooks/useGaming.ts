import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import gamingServices from "@/services/gaming.service";
import { GAMING_KEYS } from "@/constants/queryKeys";
import { toast } from "sonner";
import { handleMutationError } from "@/utils/errorHandler";
import type {
  ArcadeGameKey,
  ArcadeLeaderboardResponse,
  ApiResponse,
  GamingProfileResponse,
  MyGamingStatsResponse,
} from "@/types";

const useGamingProfile = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [GAMING_KEYS.PROFILE],
    queryFn: async () => {
      const response = await gamingServices.getMyProfile();
      return response.data;
    },
    staleTime: Infinity,
    retry: (failureCount, error: AxiosError) => {
      // Don't retry if profile not found (404 is expected for new users)
      if (error.response?.status === 404) return false;
      return failureCount < 1;
    },
    ...options,
  });
};

const useCreateGamingProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gamerName: string) => gamingServices.createProfile(gamerName),
    onSuccess: (response) => {
      queryClient.setQueryData([GAMING_KEYS.PROFILE], response.data);
      toast.success("Welcome to the Arena!");
    },
    onError: handleMutationError("Account creation failed"),
  });
};

const useClaimDailyXP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gamingServices.claimDailyXP(),
    onSuccess: (response) => {
      queryClient.setQueryData([GAMING_KEYS.PROFILE], response.data);
      toast.success("10 XP Claimed!");
    },
    onError: handleMutationError("Failed to claim XP"),
  });
};

const useGamingLeaderboard = (limit: number = 5) => {
  return useQuery({
    queryKey: [GAMING_KEYS.LEADERBOARD, limit],
    queryFn: async () => {
      const response = await gamingServices.getLeaderboard(limit);
      return response.data;
    },
  });
};

const useGamingStats = () => {
  return useQuery({
    queryKey: [GAMING_KEYS.STATS],
    queryFn: async () => {
      const response = await gamingServices.getMyStats();
      return response.data;
    },
    staleTime: Infinity, // Never consider stale; invalidated manually after submitting scores
  });
};

const useSubmitArcadeScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      answers,
      duration,
    }: {
      sessionId: string;
      answers: any[];
      duration: number;
    }) => gamingServices.submitScore(sessionId, answers, duration),
    onSuccess: async (response) => {
      queryClient.setQueriesData(
        { queryKey: [GAMING_KEYS.LEADERBOARD] },
        (existingData: ArcadeLeaderboardResponse | undefined) => {
          if (!existingData) return existingData;

          return {
            ...existingData,
            currentUser: existingData.currentUser
              ? {
                  ...existingData.currentUser,
                  games: {
                    ...existingData.currentUser.games,
                    [response.data.gameKey]: response.data.stats,
                  },
                }
              : existingData.currentUser,
          };
        }
      );

      queryClient.setQueryData(
        [GAMING_KEYS.STATS],
        (existingData: MyGamingStatsResponse | undefined) => {
          if (!existingData) return existingData;
          return {
            ...existingData,
            games: {
              ...existingData.games,
              [response.data.gameKey]: response.data.stats,
            },
          };
        }
      );

      await queryClient.refetchQueries({
        queryKey: [GAMING_KEYS.LEADERBOARD],
      });

      await queryClient.refetchQueries({
        queryKey: [GAMING_KEYS.STATS],
      });

      toast.success(
        response.data.isNewHighScore
          ? "New high score saved!"
          : "Score saved to leaderboard!"
      );
    },
    onError: handleMutationError("Failed to save score"),
  });
};

const useStartArcadeGame = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<
      GamingProfileResponse & {
        sessionId: string;
        firstQuestion: any;
        totalQuestions: number;
      }
    >,
    AxiosError<{ message: string }>,
    ArcadeGameKey
  >({
    mutationFn: (gameKey: ArcadeGameKey) => gamingServices.startGame(gameKey),
    onSuccess: (response) => {
      // Update profile with new token count safely
      queryClient.setQueryData(
        [GAMING_KEYS.PROFILE],
        (old: GamingProfileResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            profile: response.data.profile,
          };
        }
      );
    },
    // Leaving onError to component so we can show proper alert
  });
};

const useSubmitArcadeTurn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, answer }: { sessionId: string; answer: any }) =>
      gamingServices.submitTurn(sessionId, answer),
    onSuccess: async (response) => {
      if (response.data.completed && response.data.result) {
        const result = response.data.result;

        queryClient.setQueriesData(
          { queryKey: [GAMING_KEYS.LEADERBOARD] },
          (existingData: ArcadeLeaderboardResponse | undefined) => {
            if (!existingData) return existingData;

            return {
              ...existingData,
              currentUser: existingData.currentUser
                ? {
                    ...existingData.currentUser,
                    games: {
                      ...existingData.currentUser.games,
                      [result.gameKey]: result.stats,
                    },
                  }
                : existingData.currentUser,
            };
          }
        );

        queryClient.setQueryData(
          [GAMING_KEYS.STATS],
          (existingData: MyGamingStatsResponse | undefined) => {
            if (!existingData) return existingData;
            return {
              ...existingData,
              games: {
                ...existingData.games,
                [result.gameKey]: result.stats,
              },
            };
          }
        );

        await queryClient.refetchQueries({
          queryKey: [GAMING_KEYS.LEADERBOARD],
        });

        await queryClient.refetchQueries({
          queryKey: [GAMING_KEYS.STATS],
        });

        toast.success(
          result.isNewHighScore
            ? "New high score saved!"
            : "Score saved to leaderboard!"
        );
      }
    },
    onError: handleMutationError("Failed to submit turn"),
  });
};

const gamingHooks = {
  useGamingProfile,
  useCreateGamingProfile,
  useClaimDailyXP,
  useGamingLeaderboard,
  useSubmitArcadeScore,
  useSubmitArcadeTurn,
  useStartArcadeGame,
  useGamingStats,
};

export default gamingHooks;
