import { FaSpinner } from "react-icons/fa";

interface FileUploadProgressProps {
  isUploading: boolean;
  uploadProgress: number;
}

/**
 * Reusable progress component representing the two-step uploading and processing state.
 */
const FileUploadProgress = ({
  isUploading,
  uploadProgress,
}: FileUploadProgressProps) => {
  if (!isUploading) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      {/* Step 1: Uploading File */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
          <span className="flex items-center gap-1.5">
            {uploadProgress < 100 ? (
              <>
                <FaSpinner className="animate-spin text-blue-600" />
                Uploading file... {uploadProgress}%
              </>
            ) : (
              <>
                <span className="text-sm font-extrabold text-green-600">✓</span>
                Uploading file... Done
              </>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              uploadProgress < 100 ? "bg-blue-600" : "bg-green-600"
            }`}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>

      {/* Step 2: Processing & Saving */}
      <div className="flex items-center gap-1.5 pl-0.5 text-xs font-bold">
        {uploadProgress < 100 ? (
          <>
            <span className="text-gray-400">⏳</span>
            <span className="text-gray-400">
              Processing on server & saving to cloud...
            </span>
          </>
        ) : (
          <>
            <FaSpinner className="animate-spin text-blue-600" />
            <span className="text-gray-600">
              Processing on server & saving to cloud...
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploadProgress;
