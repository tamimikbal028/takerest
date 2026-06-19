import React, { useState, useEffect } from "react";
import {
  FaDownload,
  FaFile,
  FaSpinner,
  FaSearch,
  FaClock,
} from "react-icons/fa";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import quickShareServices from "@/services/quickShare.service";
import type { QuickShareDownloadResponse } from "@/services/quickShare.service";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const QuickShareReceive = () => {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [fileDetails, setFileDetails] =
    useState<QuickShareDownloadResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // remaining seconds

  // Handle countdown timer
  useEffect(() => {
    if (!fileDetails) return;

    const calculateTimeLeft = () => {
      const difference =
        new Date(fileDetails.expires_at).getTime() - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        toast.error("This share code has expired.");
        setFileDetails(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fileDetails]);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 5) {
      toast.error("Please enter a valid 5-character code.");
      return;
    }

    setLoading(true);
    setFileDetails(null);

    try {
      const response = await quickShareServices.getFileDetails(code);
      if (response.success && response.data) {
        setFileDetails(response.data);
        toast.success("File details retrieved!");
      } else {
        toast.error(response.message || "Failed to retrieve file details");
      }
    } catch (err: unknown) {
      console.error(err);
      const message = isAxiosError(err)
        ? err.response?.data?.message || "Invalid or expired share code"
        : "Invalid or expired share code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownload = async () => {
    if (!fileDetails || isDownloading) return;

    setIsDownloading(true);

    try {
      const response = await fetch(fileDetails.download_url);
      if (!response.ok) {
        throw new Error("Failed to fetch the file");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileDetails.file_name || "quick-share-file";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Let the browser finish the click before revoking the object URL.
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Could not download the file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpen = async () => {
    if (!fileDetails || isOpening) return;

    setIsOpening(true);

    // Open a blank tab synchronously to prevent the browser's popup blocker from blocking it
    const newTab = window.open("about:blank", "_blank");

    try {
      const response = await fetch(fileDetails.download_url);
      if (!response.ok) {
        throw new Error("Failed to fetch the file");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      if (newTab) {
        newTab.location.href = objectUrl;
        toast.success("File opened in a new tab.");
      } else {
        // Fallback if window.open returned null
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
    } catch (error) {
      console.error("Open failed:", error);
      toast.error("Could not open the file. Please try again.");
      // Close the opened blank tab if the request failed
      if (newTab) {
        newTab.close();
      }
    } finally {
      setIsOpening(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase();
    setCode(val);
  };

  return (
    <div className="space-y-5">
      {/* Code Retrieval Form */}
      <form onSubmit={handleRetrieve} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Enter 5-Character Quick Share Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. X8K2P"
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest uppercase ring-blue-200 transition outline-none placeholder:font-medium placeholder:tracking-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              maxLength={5}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 5}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <FaSpinner className="h-5 w-5 animate-spin" />
              ) : (
                <FaSearch className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* File Card Details */}
      {fileDetails && (
        <div className="border-gray-150 animate-fade-in space-y-4 rounded-2xl border bg-gray-50/50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <FaFile className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4
                className="truncate text-base font-bold text-gray-900"
                title={fileDetails.file_name}
              >
                {fileDetails.file_name}
              </h4>
              <p className="mt-0.5 text-xs font-semibold text-gray-500">
                Size: {formatFileSize(fileDetails.file_size)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <FaClock className="text-gray-400" />
              <span>Time remaining:</span>
              <span className="font-bold tracking-wider text-blue-600">
                {formatTimeLeft(timeLeft)}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={timeLeft <= 0 || isDownloading || isOpening}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-green-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <FaSpinner className="h-4 w-4 animate-spin" />
            ) : (
              <FaDownload className="h-4 w-4" />
            )}
            {isDownloading ? "Downloading..." : "Download File"}
          </button>
          <button
            onClick={handleOpen}
            disabled={timeLeft <= 0 || isDownloading || isOpening}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOpening ? (
              <FaSpinner className="h-4 w-4 animate-spin" />
            ) : (
              <FaFile className="h-4 w-4" />
            )}
            {isOpening ? "Opening..." : "Open File"}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickShareReceive;
