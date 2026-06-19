import React, { useState, useRef } from "react";
import { FaUpload, FaFile, FaCopy, FaSpinner, FaClock } from "react-icons/fa";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import quickShareServices from "@/services/quickShare.service";
import type { QuickShareUploadResponse } from "@/services/quickShare.service";
import { useFileUploader } from "@/hooks/useFileUploader";
import FileUploadProgress from "@/app/shared/upload/FileUploadProgress";
import type { ApiResponse } from "@/types";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const QuickShareSend = () => {
  const [expiryMinutes, setExpiryMinutes] = useState<number>(15);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedFile: file,
    isUploading,
    uploadProgress,
    handleFileChange: handleFileChangeHook,
    uploadFile,
    reset: resetUploader,
  } = useFileUploader<ApiResponse<QuickShareUploadResponse>>({
    maxSize: MAX_FILE_SIZE,
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChangeHook(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChangeHook(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiryMinutes", expiryMinutes.toString());

    try {
      const response = await uploadFile(async (onProgress) => {
        return await quickShareServices.uploadFile(
          formData,
          (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) /
                (progressEvent.total || progressEvent.loaded)
            );
            onProgress(percentCompleted);
          }
        );
      });

      if (response && response.success && response.data) {
        setGeneratedCode(response.data.code);
        setExpiresAt(response.data.expires_at);
        toast.success("File uploaded successfully!");
      } else if (response) {
        toast.error(response.message || "Failed to upload file");
      }
    } catch (err: unknown) {
      console.error(err);
      const message = isAxiosError(err)
        ? err.response?.data?.message || "An error occurred during upload"
        : "An error occurred during upload";
      toast.error(message);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    resetUploader();
    setGeneratedCode(null);
    setExpiresAt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {!generatedCode ? (
        <div className="space-y-5">
          {/* Top Control Bar (Expiry & Action Buttons) */}
          <div className="flex items-end justify-between gap-4">
            {/* Expiry Dropdown */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <FaClock className="text-xs text-gray-400" />
                File Expiration Duration
              </label>
              <select
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                disabled={isUploading}
                className="w-fit appearance-none rounded-xl border border-gray-500 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour (Max)</option>
              </select>
            </div>

            {/* Action buttons (only if file selected) */}
            {file && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <FaSpinner className="h-4.5 w-4.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="h-3.5 w-3.5" />
                      Share File
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isUploading
                ? "cursor-not-allowed border-gray-200 bg-gray-50/50"
                : "cursor-pointer"
            } ${
              dragActive
                ? "border-blue-500 bg-blue-50/50 shadow-inner"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                  <FaFile className="h-6 w-6" />
                </div>
                <div className="max-w-xs sm:max-w-md">
                  <p className="line-clamp-2 text-base font-semibold text-gray-800">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    Size: {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-blue-55 flex h-14 w-14 items-center justify-center rounded-2xl text-blue-500 transition-transform group-hover:scale-110">
                  <FaUpload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-700">
                    Drag and drop file here
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-400">
                    or click to browse from device
                  </p>
                </div>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-500">
                  Maximum size: 500 MB
                </div>
              </div>
            )}
          </div>
          <FileUploadProgress
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>
      ) : (
        /* Success Screen */
        <div className="animate-fade-in flex flex-col items-center justify-center space-y-5 text-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Your file is ready to share!
            </h3>
            <p className="mt-1.5 text-sm font-medium text-gray-500">
              Provide this 5-digit code to the recipient to download the file.
            </p>
          </div>

          {/* Large Alphanumeric Code Display */}
          <div className="border-gray-150 flex w-full max-w-sm flex-col items-center space-y-3 rounded-2xl border bg-gray-50 p-6">
            <span className="font-mono text-4xl font-extrabold tracking-widest text-gray-900 select-all">
              {generatedCode}
            </span>
            <button
              onClick={handleCopy}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition hover:border-green-500 ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
              }`}
            >
              <FaCopy />
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Expiration Details */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <FaClock className="text-gray-400" />
            <span>
              Expires at:{" "}
              {new Date(expiresAt!).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({expiryMinutes}m limit)
            </span>
          </div>

          <button
            onClick={handleReset}
            className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Share Another File
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickShareSend;
