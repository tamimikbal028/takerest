import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { supabase } from "./supabase";

/**
 * ====================================
 * AXIOS INSTANCE CONFIGURATION
 * ====================================
 *
 * Axios base setup is done in this file.
 * All API calls will use this instance.
 *
 * Key Features:
 * 1. Base URL: Taken from .env (VITE_API_BASE_URL)
 * 2. withCredentials: true → Sends cookie with every request
 * 3. Auto Token Refresh → Tries to refresh token automatically on 401 error
 */

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,

  // CRITICAL: Cookie sending/receiving won't work without this!
  // credentials: true must also be in Backend CORS
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },

  // timeout to prevent hanging requests
  timeout: 15000, // 15 seconds
});

/**
 * ====================================
 * AUTO TOKEN REFRESH LOGIC
 * ====================================
 *
 * When Access Token expires:
 * 1. Backend gives 401 Unauthorized
 * 2. This interceptor catches it
 * 3. Automatically calls /refresh-token
 * 4. Tries original request again if new token is received
 * 5. User won't notice - seamless experience!
 */

// Flag to prevent multiple refresh attempts at the same time
// If many requests get 401 at once, it will only refresh once
let isRefreshing = false;

// Queue for requests that are waiting for token refresh
// Other requests will wait here during refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process all queued requests after refresh completes
const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor for handling 401 errors and token refresh
api.interceptors.response.use(
  // Success response → return directly
  (response) => response,

  // Error response → try refresh if 401
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // No need to refresh for these routes
      // Login/Register failure is user error, not token issue
      // current-user fail means user is not logged in, no use trying refresh
      const skipRefreshUrls = [
        "/auth/login",
        "/auth/register",
        "/auth/refresh-token",
        "/auth/current-user", // 401 expected if logged out
      ];
      if (skipRefreshUrls.some((url) => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }

      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Mark as retrying and start refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        // Backend will set new access token in cookie
        await api.post("/auth/refresh-token");
        processQueue(null);

        // Refresh successful! Try original request again
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - session expired
        processQueue(refreshError as Error);

        // Dispatch custom event - App.tsx is listening
        // This will logout the user and take them to login page
        window.dispatchEvent(new CustomEvent("auth:logout"));

        // Sign out from Supabase to prevent desync (Fix 3)
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("Failed to sign out from Supabase on session expiry:", e);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
