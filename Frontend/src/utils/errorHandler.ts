import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

// Overload 1: Higher-Order Function usage
export function handleMutationError(
  fallbackMessage: string
): (error: unknown) => void;

// Overload 2: Direct execution usage
export function handleMutationError(
  error: unknown,
  fallbackMessage: string
): void;

// Implementation
export function handleMutationError(arg1: unknown, arg2?: string) {
  // If the first argument is a string, it's the HOF usage
  if (typeof arg1 === "string") {
    const fallback = arg1;
    return (error: unknown) => {
      _processError(error, fallback);
    };
  }

  // Otherwise, it's the direct execution usage
  const error = arg1;
  const fallback = arg2 as string;
  _processError(error, fallback);
}

// Core error extraction logic
const _processError = (error: unknown, fallbackMessage: string) => {
  // Check if error is an object with a message property and without response property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    !("response" in error)
  ) {
    toast.error((error as { message: string }).message);
    return;
  }

  // Check if it's an AxiosError
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as AxiosError<ApiError>;
    const errorData = axiosErr.response?.data;

    // Case 1: Multiple validation errors (422 status)
    if (
      errorData?.errors &&
      Array.isArray(errorData.errors) &&
      errorData.errors.length > 0
    ) {
      errorData.errors.forEach((err: string) => toast.error(err));
      return;
    }

    // Case 2: Single error message
    if (errorData?.message) {
      toast.error(errorData.message);
      return;
    }
  }

  // Case 3: Fallback
  toast.error(fallbackMessage);
};
