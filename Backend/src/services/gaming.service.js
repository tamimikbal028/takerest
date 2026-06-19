import { supabase } from "../config/supabase.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { ApiError } from "../utils/ApiError.js";
import { ARCADE_GAME_KEYS } from "../constants/gaming.js";
import { getGameLogic } from "./games/gameRegistry.js";

const GAMING_TIME_ZONE = "Asia/Dhaka";

dayjs.extend(utc);
dayjs.extend(timezone);

const getCurrentGamingDate = (date = new Date()) => {
  return dayjs(date).tz(GAMING_TIME_ZONE).format("YYYY-MM-DD");
};

const mapGamingProfileRowToApi = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    user: row.user_id,
    gamerName: row.gamer_name,
    xp: row.xp ?? 0,
    lifetimeXP: row.lifetime_xp ?? 0,
    xpFromDailyClaim: row.xp_from_daily_claim ?? 0,
    xpFromPrizes: row.xp_from_prizes ?? 0,
    tokens: row.tokens ?? 0,
    lastClaimDate: row.last_claim_date ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const ensureGamingProfileExists = async (userId) => {
  const { data: profile, error } = await supabase
    .from("gaming_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new ApiError(404, "Gaming profile not found");
  }

  return mapGamingProfileRowToApi(profile);
};

const validateArcadeGameKey = (gameKey) => {
  if (!ARCADE_GAME_KEYS.includes(gameKey)) {
    throw new ApiError(400, "Invalid game selected");
  }
};

const normalizeArcadeScore = (score) => {
  if (!Number.isFinite(score) || score < 0) {
    throw new ApiError(400, "Score must be a non-negative number");
  }

  return Math.round(score);
};

const createEmptyGameStats = () =>
  Object.fromEntries(
    ARCADE_GAME_KEYS.map((gameKey) => [
      gameKey,
      {
        weeklyBestScore: 0,
        lifetimeBestScore: 0,
        latestScore: 0,
        weeklyPlaysCount: 0,
        lifetimePlaysCount: 0,
        lastPlayedAt: null,
      },
    ])
  );

const buildUserArcadeSummary = async (gamingProfileId) => {
  const { data: scores, error } = await supabase
    .from("arcade_scores")
    .select(
      `
      *,
      games (
        key
      )
    `
    )
    .eq("gaming_profile_id", gamingProfileId);

  if (error) {
    throw new ApiError(500, error.message);
  }

  const games = createEmptyGameStats();

  if (scores) {
    scores.forEach((score) => {
      const gameKey = score.games?.key;
      if (!gameKey || !ARCADE_GAME_KEYS.includes(gameKey)) return;
      games[gameKey] = {
        weeklyBestScore: Number(score.weekly_best_score) || 0,
        lifetimeBestScore: Number(score.lifetime_best_score) || 0,
        latestScore: Number(score.latest_score) || 0,
        weeklyPlaysCount: Number(score.weekly_plays_count) || 0,
        lifetimePlaysCount: Number(score.lifetime_plays_count) || 0,
        lastPlayedAt: score.last_played_at ?? null,
      };
    });
  }

  return { games };
};

const formatGameLeaderboardEntry = (gamingProfile, gameStats, rank = null) => ({
  rank,
  profile: {
    id: gamingProfile.id,
    gamerName: gamingProfile.gamerName,
  },
  weeklyBestScore: gameStats.weeklyBestScore || 0,
  weeklyBestScoreDuration: gameStats.weeklyBestScoreDuration || 0,
  lifetimeBestScore: gameStats.lifetimeBestScore || 0,
  latestScore: gameStats.latestScore || 0,
  latestScoreDuration: gameStats.latestScoreDuration || 0,
  weeklyPlaysCount: gameStats.weeklyPlaysCount || 0,
  lifetimePlaysCount: gameStats.lifetimePlaysCount || 0,
  lastPlayedAt: gameStats.lastPlayedAt,
});

const getArcadeLeaderboard = async (
  currentUserId,
  limit = 5,
  isAdminMode = false
) => {
  let currentGamingProfile = null;
  if (!isAdminMode && currentUserId) {
    const { data: profile, error: profileError } = await supabase
      .from("gaming_profiles")
      .select("*")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (profileError) {
      throw new ApiError(500, profileError.message);
    }
    if (profile) {
      currentGamingProfile = mapGamingProfileRowToApi(profile);
    }
  }

  const { data: allScores, error: scoresError } = await supabase.from(
    "arcade_scores"
  ).select(`
      *,
      gaming_profiles!inner (
        id,
        gamer_name
      ),
      games!inner (
        key
      )
    `);

  if (scoresError) {
    throw new ApiError(500, scoresError.message);
  }

  const leaderboards = {};
  const currentUserRanks = {};
  ARCADE_GAME_KEYS.forEach((k) => {
    leaderboards[k] = [];
    currentUserRanks[k] = null;
  });

  ARCADE_GAME_KEYS.forEach((gameKey) => {
    const entries = allScores
      .filter((score) => score.games?.key === gameKey && score.gaming_profiles)
      .sort((a, b) => {
        const valA = a.weekly_best_score || 0;
        const valB = b.weekly_best_score || 0;
        if (valB !== valA) return valB - valA;

        // Tie-breaker 1: Duration (Ascending - lower is better)
        const durA = a.weekly_best_score_duration || Number.MAX_SAFE_INTEGER;
        const durB = b.weekly_best_score_duration || Number.MAX_SAFE_INTEGER;
        if (durA !== durB) return durA - durB;

        // Tie-breaker 2: Time achieved (Ascending - earlier is better)
        const timeA = a.last_played_at
          ? new Date(a.last_played_at).getTime()
          : 0;
        const timeB = b.last_played_at
          ? new Date(b.last_played_at).getTime()
          : 0;
        return timeA - timeB;
      })
      .map((score, index) => {
        const gp = {
          id: score.gaming_profiles.id,
          gamerName: score.gaming_profiles.gamer_name,
        };
        const stats = {
          weeklyBestScore: score.weekly_best_score,
          weeklyBestScoreDuration: score.weekly_best_score_duration,
          lifetimeBestScore: score.lifetime_best_score,
          latestScore: score.latest_score,
          latestScoreDuration: score.latest_score_duration,
          weeklyPlaysCount: score.weekly_plays_count,
          lifetimePlaysCount: score.lifetime_plays_count,
          lastPlayedAt: score.last_played_at,
        };
        return formatGameLeaderboardEntry(gp, stats, index + 1);
      });

    if (currentGamingProfile) {
      const myEntry = entries.find(
        (e) => e.profile.id.toString() === currentGamingProfile.id.toString()
      );
      currentUserRanks[gameKey] = myEntry?.rank ?? null;
    }

    leaderboards[gameKey] = entries.slice(0, limit);
  });

  if (isAdminMode) return { leaderboards };

  const currentUserSummary = currentGamingProfile
    ? await buildUserArcadeSummary(currentGamingProfile.id)
    : { games: createEmptyGameStats() };

  return {
    leaderboards,
    currentUser: currentGamingProfile
      ? {
          profile: {
            id: currentGamingProfile.id,
            gamerName: currentGamingProfile.gamerName,
          },
          games: currentUserSummary.games,
          ranks: currentUserRanks,
        }
      : null,
  };
};

const getProfileByUserId = async (userId) => {
  const { data: profile, error } = await supabase
    .from("gaming_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!profile) return { profile: null };

  const mappedProfile = mapGamingProfileRowToApi(profile);
  const today = getCurrentGamingDate();
  const canClaimDaily = mappedProfile.lastClaimDate !== today;

  return { profile: mappedProfile, meta: { canClaimDaily } };
};

const createProfile = async (userId, gamerName) => {
  // Check if profile already exists
  const { data: existingProfile, error: existError } = await supabase
    .from("gaming_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existError) {
    throw new ApiError(500, existError.message);
  }
  if (existingProfile) {
    throw new ApiError(400, "You already have a gaming profile");
  }

  const formattedName = gamerName.trim().replace(/\s+/g, "_");

  if (formattedName.length < 3 || formattedName.length > 15) {
    throw new ApiError(
      400,
      "Gamer name must be between 3 and 15 characters long"
    );
  }

  // Check if name is taken
  const { data: nameExists, error: nameError } = await supabase
    .from("gaming_profiles")
    .select("id")
    .eq("gamer_name", formattedName)
    .maybeSingle();

  if (nameError) {
    throw new ApiError(500, nameError.message);
  }
  if (nameExists) {
    throw new ApiError(
      400,
      "This gamer name is already taken. Please try another one."
    );
  }

  const { data: profile, error: insertError } = await supabase
    .from("gaming_profiles")
    .insert({
      user_id: userId,
      gamer_name: formattedName,
      xp: 150,
      lifetime_xp: 150,
      xp_from_daily_claim: 0,
      xp_from_prizes: 0,
      tokens: 50,
      last_claim_date: null,
    })
    .select()
    .single();

  if (insertError || !profile) {
    throw new ApiError(500, insertError?.message || "Failed to create profile");
  }

  const mappedProfile = mapGamingProfileRowToApi(profile);

  return { profile: mappedProfile, meta: { canClaimDaily: true } };
};

const startArcadeGame = async (userId, gameKey) => {
  const profile = await ensureGamingProfileExists(userId);
  validateArcadeGameKey(gameKey);

  // 1. Fetch game config from database
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("key", gameKey)
    .eq("is_active", true)
    .maybeSingle();

  if (gameError || !game) {
    throw new ApiError(400, "Invalid or inactive game selected");
  }

  // 2. Token check
  if (profile.tokens < 1) {
    throw new ApiError(403, "You don't have enough tokens to play this game");
  }

  // 3. Generate secure server-side questions/rounds using polymorphic handler
  const gameLogic = getGameLogic(gameKey);
  const fullState = gameLogic.generate(game.content_config);

  const initialSessionState = {
    fullState,
    currentIndex: 0,
    score: 0,
    mistakes: 0,
    skips: 0,
    answers: [],
  };

  const sessionDuration =
    gameKey === "logical-deduction" ||
    gameKey === "logical-deduction-2" ||
    gameKey === "sum-matrix"
      ? 15 * 60 * 1000
      : 5 * 60 * 1000;
  const expiresAt = new Date(Date.now() + sessionDuration).toISOString();
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      gaming_profile_id: profile.id,
      game_id: game.id,
      status: "PLAYING",
      session_state: initialSessionState,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new ApiError(
      500,
      sessionError?.message || "Failed to create game session"
    );
  }

  // 5. Deduct token
  const newTokens = profile.tokens - 1;
  const { data: updatedProfile, error: updateError } = await supabase
    .from("gaming_profiles")
    .update({ tokens: newTokens })
    .eq("id", profile.id)
    .select()
    .single();

  if (updateError || !updatedProfile) {
    throw new ApiError(500, updateError?.message || "Failed to deduct token");
  }

  // Extract variables depending on which game structure is returned
  const items = fullState.questions || fullState.rounds || fullState.levels;
  const firstItem = items[0];
  let redactedFirstItem = firstItem;
  const totalQuestions = items.length;

  if (gameKey === "math-sprint" && gameLogic.redactQuestion) {
    redactedFirstItem = gameLogic.redactQuestion(firstItem);
  } else if (gameLogic.redactLevel) {
    redactedFirstItem = gameLogic.redactLevel(firstItem);
  } else if (gameLogic.redactRound) {
    redactedFirstItem = gameLogic.redactRound(firstItem);
  }

  return {
    profile: mapGamingProfileRowToApi(updatedProfile),
    gameKey,
    sessionId: session.id,
    firstQuestion: redactedFirstItem,
    totalQuestions,
  };
};

const checkGamerNameAvailability = async (gamerName) => {
  const { data: existing, error } = await supabase
    .from("gaming_profiles")
    .select("id")
    .eq("gamer_name", gamerName)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  const isAvailable = !existing;
  return { isAvailable };
};

const claimDailyXP = async (userId) => {
  const today = getCurrentGamingDate();
  const { data: profile, error } = await supabase
    .from("gaming_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (profile.last_claim_date === today) {
    throw new ApiError(400, "Already claimed today");
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("gaming_profiles")
    .update({
      xp: (profile.xp || 0) + 10,
      lifetime_xp: (profile.lifetime_xp || 0) + 10,
      xp_from_daily_claim: (profile.xp_from_daily_claim || 0) + 10,
      last_claim_date: today,
    })
    .eq("id", profile.id)
    .select()
    .single();

  if (updateError || !updatedProfile) {
    throw new ApiError(500, updateError?.message || "Failed to claim daily XP");
  }

  return {
    profile: mapGamingProfileRowToApi(updatedProfile),
    meta: { canClaimDaily: false },
  };
};

const submitArcadeScore = async (userId, sessionId, answers, duration) => {
  const gamingProfile = await ensureGamingProfileExists(userId);
  const roundedDuration = Math.round(Number(duration) || 0);

  // 1. Fetch game session and join core games info
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select(
      `
      *,
      games (
        id,
        key,
        content_config
      )
    `
    )
    .eq("id", sessionId)
    .eq("gaming_profile_id", gamingProfile.id)
    .maybeSingle();

  if (sessionError || !session) {
    throw new ApiError(404, "Game session not found or invalid");
  }

  if (session.status !== "PLAYING") {
    throw new ApiError(
      400,
      "This session has already been submitted or completed"
    );
  }

  // 2. Expiry verification
  if (new Date() > new Date(session.expires_at)) {
    await supabase
      .from("game_sessions")
      .update({ status: "EXPIRED" })
      .eq("id", sessionId);
    throw new ApiError(400, "This game session has expired");
  }

  const game = session.games;
  if (!game) {
    throw new ApiError(500, "Game configuration not found");
  }

  // 3. Evaluate answers using polymorphism registry logic
  const gameLogic = getGameLogic(game.key);
  const evaluation = gameLogic.verify(
    session.session_state,
    { answers },
    game.content_config
  );

  const score = evaluation.score;

  // 4. Mark session completed
  await supabase
    .from("game_sessions")
    .update({ status: "COMPLETED" })
    .eq("id", sessionId);

  // 5. Fetch score row from DB to determine high score
  const { data: arcadeScore, error: scoreError } = await supabase
    .from("arcade_scores")
    .select("*")
    .eq("gaming_profile_id", gamingProfile.id)
    .eq("game_id", game.id)
    .maybeSingle();

  if (scoreError) {
    throw new ApiError(500, scoreError.message);
  }

  const isBetterScore = !arcadeScore || score > arcadeScore.weekly_best_score;
  const isBetterTime =
    arcadeScore &&
    score === arcadeScore.weekly_best_score &&
    (roundedDuration < arcadeScore.weekly_best_score_duration ||
      arcadeScore.weekly_best_score_duration === 0);

  const isNewHighScore = isBetterScore || isBetterTime;

  if (!arcadeScore) {
    const { error: insertError } = await supabase.from("arcade_scores").insert({
      gaming_profile_id: gamingProfile.id,
      game_id: game.id,
      weekly_best_score: score,
      weekly_best_score_duration: roundedDuration,
      lifetime_best_score: score,
      latest_score: score,
      latest_score_duration: roundedDuration,
      weekly_plays_count: 1,
      lifetime_plays_count: 1,
      last_played_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new ApiError(500, insertError.message || "Failed to submit score");
    }
  } else {
    const updates = {
      latest_score: score,
      latest_score_duration: roundedDuration,
      lifetime_best_score: Math.max(
        arcadeScore.lifetime_best_score || 0,
        score
      ),
      weekly_plays_count: (arcadeScore.weekly_plays_count || 0) + 1,
      lifetime_plays_count: (arcadeScore.lifetime_plays_count || 0) + 1,
      last_played_at: new Date().toISOString(),
    };

    if (isNewHighScore) {
      updates.weekly_best_score = score;
      updates.weekly_best_score_duration = roundedDuration;
    }

    const { error: updateError } = await supabase
      .from("arcade_scores")
      .update(updates)
      .eq("id", arcadeScore.id);

    if (updateError) {
      throw new ApiError(500, updateError.message || "Failed to update score");
    }
  }

  // Fetch only this specific game's updated score stats for scalability
  const { data: finalScoreRow, error: fetchError } = await supabase
    .from("arcade_scores")
    .select("*")
    .eq("gaming_profile_id", gamingProfile.id)
    .eq("game_id", game.id)
    .single();

  if (fetchError || !finalScoreRow) {
    throw new ApiError(500, "Failed to retrieve updated game stats");
  }

  const mappedStats = {
    weeklyBestScore: Number(finalScoreRow.weekly_best_score) || 0,
    weeklyBestScoreDuration:
      Number(finalScoreRow.weekly_best_score_duration) || 0,
    lifetimeBestScore: Number(finalScoreRow.lifetime_best_score) || 0,
    latestScore: Number(finalScoreRow.latest_score) || 0,
    latestScoreDuration: Number(finalScoreRow.latest_score_duration) || 0,
    weeklyPlaysCount: Number(finalScoreRow.weekly_plays_count) || 0,
    lifetimePlaysCount: Number(finalScoreRow.lifetime_plays_count) || 0,
    lastPlayedAt: finalScoreRow.last_played_at ?? null,
  };

  return {
    gameKey: game.key,
    score: score,
    isNewHighScore,
    stats: mappedStats,
  };
};

const submitArcadeTurn = async (userId, sessionId, answer) => {
  const gamingProfile = await ensureGamingProfileExists(userId);

  // 1. Fetch game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select(
      `
      *,
      games (
        id,
        key,
        content_config
      )
    `
    )
    .eq("id", sessionId)
    .eq("gaming_profile_id", gamingProfile.id)
    .maybeSingle();

  if (sessionError || !session) {
    throw new ApiError(404, "Game session not found or invalid");
  }

  if (session.status !== "PLAYING") {
    throw new ApiError(
      400,
      "This session has already been submitted or completed"
    );
  }

  // 2. Expiry verification
  if (new Date() > new Date(session.expires_at)) {
    await supabase
      .from("game_sessions")
      .update({ status: "EXPIRED" })
      .eq("id", sessionId);
    throw new ApiError(400, "This game session has expired");
  }

  const game = session.games;
  if (!game) {
    throw new ApiError(500, "Game configuration not found");
  }

  const gameLogic = getGameLogic(game.key);
  const sessionState = session.session_state;

  // 3. Verify the current turn
  const turnResult = gameLogic.verifyTurn(
    sessionState,
    answer,
    game.content_config
  );

  const {
    isCorrect,
    correctAnswer,
    nextScore,
    nextMistakes,
    nextSkips,
    completed,
  } = turnResult;

  // For logical-deduction (multi-round), verifyTurn mutates fullState.rounds in-place
  // and returns roundCompleted. Advance currentIndex only when a round ends.
  const roundCompleted = turnResult.roundCompleted ?? true;

  // fullState may have been mutated in-place by verifyTurn (e.g. rounds[i].guesses)
  // Use the existing reference directly so mutations are captured.
  const updatedFullState = sessionState.fullState;

  const updatedAnswers = [...(sessionState.answers || []), answer];
  const newSessionState = {
    ...sessionState,
    fullState: updatedFullState,
    currentIndex: roundCompleted
      ? sessionState.currentIndex + 1
      : sessionState.currentIndex,
    score: nextScore,
    mistakes: nextMistakes,
    skips: nextSkips,
    answers: updatedAnswers,
  };

  if (completed) {
    // 4. Mark session completed
    const { error: updateSessionError } = await supabase
      .from("game_sessions")
      .update({
        status: "COMPLETED",
        session_state: newSessionState,
      })
      .eq("id", sessionId);

    if (updateSessionError) {
      throw new ApiError(500, "Failed to complete game session");
    }

    // 5. Fetch score row from DB to determine high score
    const { data: arcadeScore, error: scoreError } = await supabase
      .from("arcade_scores")
      .select("*")
      .eq("gaming_profile_id", gamingProfile.id)
      .eq("game_id", game.id)
      .maybeSingle();

    if (scoreError) {
      throw new ApiError(500, scoreError.message);
    }

    // Calculate duration
    const durationMs = Date.now() - new Date(session.started_at).getTime();
    const roundedDuration = Math.round(durationMs / 1000);

    const isBetterScore =
      !arcadeScore || nextScore > arcadeScore.weekly_best_score;
    const isBetterTime =
      arcadeScore &&
      nextScore === arcadeScore.weekly_best_score &&
      (roundedDuration < arcadeScore.weekly_best_score_duration ||
        arcadeScore.weekly_best_score_duration === 0);

    const isNewHighScore = isBetterScore || isBetterTime;

    if (!arcadeScore) {
      const { error: insertError } = await supabase
        .from("arcade_scores")
        .insert({
          gaming_profile_id: gamingProfile.id,
          game_id: game.id,
          weekly_best_score: nextScore,
          weekly_best_score_duration: roundedDuration,
          lifetime_best_score: nextScore,
          latest_score: nextScore,
          latest_score_duration: roundedDuration,
          weekly_plays_count: 1,
          lifetime_plays_count: 1,
          last_played_at: new Date().toISOString(),
        });

      if (insertError) {
        throw new ApiError(
          500,
          insertError.message || "Failed to submit score"
        );
      }
    } else {
      const updates = {
        latest_score: nextScore,
        latest_score_duration: roundedDuration,
        lifetime_best_score: Math.max(
          arcadeScore.lifetime_best_score || 0,
          nextScore
        ),
        weekly_plays_count: (arcadeScore.weekly_plays_count || 0) + 1,
        lifetime_plays_count: (arcadeScore.lifetime_plays_count || 0) + 1,
        last_played_at: new Date().toISOString(),
      };

      if (isNewHighScore) {
        updates.weekly_best_score = nextScore;
        updates.weekly_best_score_duration = roundedDuration;
      }

      const { error: updateError } = await supabase
        .from("arcade_scores")
        .update(updates)
        .eq("id", arcadeScore.id);

      if (updateError) {
        throw new ApiError(
          500,
          updateError.message || "Failed to update score"
        );
      }
    }

    // Fetch only this specific game's updated score stats for scalability
    const { data: finalScoreRow, error: fetchError } = await supabase
      .from("arcade_scores")
      .select("*")
      .eq("gaming_profile_id", gamingProfile.id)
      .eq("game_id", game.id)
      .single();

    if (fetchError || !finalScoreRow) {
      throw new ApiError(500, "Failed to retrieve updated game stats");
    }

    const mappedStats = {
      weeklyBestScore: Number(finalScoreRow.weekly_best_score) || 0,
      weeklyBestScoreDuration:
        Number(finalScoreRow.weekly_best_score_duration) || 0,
      lifetimeBestScore: Number(finalScoreRow.lifetime_best_score) || 0,
      latestScore: Number(finalScoreRow.latest_score) || 0,
      latestScoreDuration: Number(finalScoreRow.latest_score_duration) || 0,
      weeklyPlaysCount: Number(finalScoreRow.weekly_plays_count) || 0,
      lifetimePlaysCount: Number(finalScoreRow.lifetime_plays_count) || 0,
      lastPlayedAt: finalScoreRow.last_played_at ?? null,
    };

    return {
      completed: true,
      isCorrect,
      correctAnswer,
      score: nextScore,
      mistakes: nextMistakes,
      skips: nextSkips,
      // Pass through any extra fields from verifyTurn (logical-deduction etc.)
      ...turnResult,
      // Ensure base fields are not overwritten
      completed: true,
      nextScore: undefined,
      nextMistakes: undefined,
      nextSkips: undefined,
      result: {
        gameKey: game.key,
        score: nextScore,
        isNewHighScore,
        stats: mappedStats,
      },
    };
  } else {
    // Game not completed: update session state progress
    const { error: updateSessionError } = await supabase
      .from("game_sessions")
      .update({
        session_state: newSessionState,
      })
      .eq("id", sessionId);

    if (updateSessionError) {
      throw new ApiError(500, "Failed to save game session turn progress");
    }

    // Prepare next question/round/level and redact it
    // For logical-deduction, verifyTurn already provides nextRound in turnResult.
    let nextQuestion = turnResult.nextRound ?? null;

    if (!nextQuestion) {
      const fullState = sessionState.fullState;
      const nextIndex = newSessionState.currentIndex;

      if (game.key === "math-sprint") {
        const q = fullState.questions[nextIndex];
        nextQuestion = gameLogic.redactQuestion(q);
      } else if (
        game.key === "grid-hunter" ||
        game.key === "speed-equate" ||
        game.key === "logic-path" ||
        game.key === "operator-grid" ||
        game.key === "arithmetic-path" ||
        game.key === "logical-deduction-2" ||
        game.key === "sum-matrix"
      ) {
        const r = (fullState.levels || fullState.rounds)[nextIndex];
        nextQuestion = (gameLogic.redactLevel || gameLogic.redactRound)(r);
      }
    }

    return {
      completed: false,
      // Pass through all extra fields from verifyTurn (logical-deduction etc.)
      ...turnResult,
      // Ensure base fields are not overwritten
      completed: false,
      nextQuestion,
      currentScore: nextScore,
      nextScore: undefined,
      nextMistakes: undefined,
      nextSkips: undefined,
      mistakes: nextMistakes,
      skips: nextSkips,
    };
  }
};

const REWARDS = {
  RANK_1: 200,
  RANK_2: 100,
  RANK_3: 50,
};

const getFridayDate = (date = new Date()) => {
  const d = dayjs(date).tz(GAMING_TIME_ZONE);
  const diff = d.day() >= 5 ? d.day() - 5 : d.day() + 2;
  return d.subtract(diff, "day").format("YYYY-MM-DD");
};

const processWeeklyRewards = async () => {
  const today = dayjs().tz(GAMING_TIME_ZONE);
  const currentFriday = getFridayDate();

  const { data: existingSeason, error: seasonError } = await supabase
    .from("leaderboard_seasons")
    .select("*")
    .eq("week_end_date", currentFriday)
    .maybeSingle();

  if (seasonError) {
    throw new ApiError(500, seasonError.message);
  }
  if (existingSeason && existingSeason.rewards_distributed) {
    return {
      message: "Rewards already distributed for this week",
      alreadyDone: true,
    };
  }

  const isLateFriday = today.day() === 5 && today.hour() >= 22;
  const isWeekend = today.day() === 6 || today.day() === 0;

  if (!isLateFriday && !isWeekend) {
    return { message: "Too early for weekly rewards", alreadyDone: false };
  }

  const leaderboardData = await getArcadeLeaderboard(null, 3, true);
  const seasonWinners = [];

  const { data: newSeason, error: createSeasonError } = await supabase
    .from("leaderboard_seasons")
    .insert({
      week_end_date: currentFriday,
      rewards_distributed: true,
    })
    .select()
    .single();

  if (createSeasonError || !newSeason) {
    throw new ApiError(
      500,
      createSeasonError?.message || "Failed to create leaderboard season"
    );
  }

  // Pre-fetch game registry mappings to convert keys to IDs
  const { data: gamesList } = await supabase.from("games").select("id, key");
  const gameKeyToId = Object.fromEntries(
    (gamesList || []).map((g) => [g.key, g.id])
  );

  const winnersToInsert = [];

  for (const gameKey of ARCADE_GAME_KEYS) {
    const top3 = leaderboardData.leaderboards[gameKey] || [];
    const winnersInfo = { gameKey, rank1: null, rank2: null, rank3: null };
    const gameId = gameKeyToId[gameKey];

    if (!gameId) continue;

    if (top3[0]) {
      winnersInfo.rank1 = top3[0].profile.id;
      const { data: prof } = await supabase
        .from("gaming_profiles")
        .select("xp, lifetime_xp, xp_from_prizes")
        .eq("id", top3[0].profile.id)
        .single();
      if (prof) {
        await supabase
          .from("gaming_profiles")
          .update({
            xp: (prof.xp || 0) + REWARDS.RANK_1,
            lifetime_xp: (prof.lifetime_xp || 0) + REWARDS.RANK_1,
            xp_from_prizes: (prof.xp_from_prizes || 0) + REWARDS.RANK_1,
          })
          .eq("id", top3[0].profile.id);
      }
      winnersToInsert.push({
        season_id: newSeason.id,
        game_id: gameId,
        rank: 1,
        gaming_profile_id: top3[0].profile.id,
      });
    }
    if (top3[1]) {
      winnersInfo.rank2 = top3[1].profile.id;
      const { data: prof } = await supabase
        .from("gaming_profiles")
        .select("xp, lifetime_xp, xp_from_prizes")
        .eq("id", top3[1].profile.id)
        .single();
      if (prof) {
        await supabase
          .from("gaming_profiles")
          .update({
            xp: (prof.xp || 0) + REWARDS.RANK_2,
            lifetime_xp: (prof.lifetime_xp || 0) + REWARDS.RANK_2,
            xp_from_prizes: (prof.xp_from_prizes || 0) + REWARDS.RANK_2,
          })
          .eq("id", top3[1].profile.id);
      }
      winnersToInsert.push({
        season_id: newSeason.id,
        game_id: gameId,
        rank: 2,
        gaming_profile_id: top3[1].profile.id,
      });
    }
    if (top3[2]) {
      winnersInfo.rank3 = top3[2].profile.id;
      const { data: prof } = await supabase
        .from("gaming_profiles")
        .select("xp, lifetime_xp, xp_from_prizes")
        .eq("id", top3[2].profile.id)
        .single();
      if (prof) {
        await supabase
          .from("gaming_profiles")
          .update({
            xp: (prof.xp || 0) + REWARDS.RANK_3,
            lifetime_xp: (prof.lifetime_xp || 0) + REWARDS.RANK_3,
            xp_from_prizes: (prof.xp_from_prizes || 0) + REWARDS.RANK_3,
          })
          .eq("id", top3[2].profile.id);
      }
      winnersToInsert.push({
        season_id: newSeason.id,
        game_id: gameId,
        rank: 3,
        gaming_profile_id: top3[2].profile.id,
      });
    }

    seasonWinners.push(winnersInfo);
  }

  if (winnersToInsert.length > 0) {
    const { error: insertWinnersError } = await supabase
      .from("leaderboard_season_winners")
      .insert(winnersToInsert);

    if (insertWinnersError) {
      throw new ApiError(
        500,
        insertWinnersError.message || "Failed to insert season winners"
      );
    }
  }

  // Soft Reset: Only zero out weekly score, but keep lifetime best score intact
  const { error: resetError } = await supabase
    .from("arcade_scores")
    .update({
      weekly_best_score: 0,
      weekly_best_score_duration: 0,
      latest_score: 0,
      latest_score_duration: 0,
      weekly_plays_count: 0,
      last_played_at: new Date().toISOString(),
    })
    .gt("weekly_best_score", -1);

  if (resetError) {
    throw new ApiError(
      500,
      resetError.message || "Failed to reset arcade scores"
    );
  }

  return {
    message: "Weekly rewards distributed and leaderboard reset successfully",
    winners: seasonWinners,
  };
};

const getMyGamingStats = async (userId) => {
  const currentGamingProfile = await ensureGamingProfileExists(userId);

  // 1. Fetch user arcade scores summary
  const currentUserSummary = await buildUserArcadeSummary(
    currentGamingProfile.id
  );

  // 2. Fetch all scores to compute ranks
  const { data: allScores, error: scoresError } = await supabase.from(
    "arcade_scores"
  ).select(`
      *,
      gaming_profiles!inner (
        id,
        gamer_name
      ),
      games!inner (
        key
      )
    `);

  if (scoresError) {
    throw new ApiError(500, scoresError.message);
  }

  const currentUserRanks = {};
  ARCADE_GAME_KEYS.forEach((k) => {
    currentUserRanks[k] = null;
  });

  ARCADE_GAME_KEYS.forEach((gameKey) => {
    const gameScores = allScores.filter(
      (score) => score.games?.key === gameKey && score.gaming_profiles
    );

    const myScoreRow = gameScores.find(
      (score) => score.gaming_profile_id === currentGamingProfile.id
    );

    if (!myScoreRow) {
      currentUserRanks[gameKey] = null;
      return;
    }

    // Sort to determine rank (identical to leaderboard sorting logic)
    const sorted = gameScores.sort((a, b) => {
      const valA = a.weekly_best_score || 0;
      const valB = b.weekly_best_score || 0;
      if (valB !== valA) return valB - valA;

      const durA = a.weekly_best_score_duration || Number.MAX_SAFE_INTEGER;
      const durB = b.weekly_best_score_duration || Number.MAX_SAFE_INTEGER;
      if (durA !== durB) return durA - durB;

      const timeA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
      const timeB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
      return timeA - timeB;
    });

    const myIndex = sorted.findIndex(
      (score) => score.gaming_profile_id === currentGamingProfile.id
    );
    currentUserRanks[gameKey] = myIndex !== -1 ? myIndex + 1 : null;
  });

  return {
    profile: {
      id: currentGamingProfile.id,
      gamerName: currentGamingProfile.gamerName,
      tokens: currentGamingProfile.tokens,
      xp: currentGamingProfile.xp,
    },
    games: currentUserSummary.games,
    ranks: currentUserRanks,
  };
};

const gamingProfileServices = {
  getProfileByUserId,
  createProfile,
  checkGamerNameAvailability,
  claimDailyXP,
  startArcadeGame,
  submitArcadeScore,
  submitArcadeTurn,
  getArcadeLeaderboard,
  processWeeklyRewards,
  getMyGamingStats,
};

export default gamingProfileServices;
