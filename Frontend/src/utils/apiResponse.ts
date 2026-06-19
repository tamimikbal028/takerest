import type { ApiResponse } from "@/types";

export const createApiResponse = <T>(
  data: T,
  message: string,
  statusCode = 200
): ApiResponse<T> => ({
  statusCode,
  data,
  message,
  success: statusCode >= 200 && statusCode < 300,
});

