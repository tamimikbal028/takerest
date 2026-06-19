import { useState, useCallback } from "react";
import { toast } from "sonner";
import { zipFolder } from "@/utils/zipping";

export interface FileUploaderOptions<T = unknown> {
  maxSize?: number;
  onSuccess?: (response: T) => void;
  onError?: (error: unknown) => void;
}

/**
 * Reusable hook to handle file selection, directory zipping,
 * upload progress tracking, and file size validation.
 */
export const useFileUploader = <T = unknown>(
  options: FileUploaderOptions<T> = {}
) => {
  const { maxSize, onSuccess, onError } = options;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalFolderSize, setOriginalFolderSize] = useState<number | null>(
    null
  );
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = useCallback(
    (file: File, fileMaxSize = maxSize) => {
      if (fileMaxSize && file.size > fileMaxSize) {
        toast.error(
          `File size exceeds limit of ${fileMaxSize / (1024 * 1024)}MB!`
        );
        return false;
      }
      setSelectedFile(file);
      setOriginalFolderSize(null);
      return true;
    },
    [maxSize]
  );

  const handleFolderChange = useCallback(
    async (files: FileList | File[] | null, folderMaxSize = maxSize) => {
      if (!files || files.length === 0) return false;

      // Calculate total size of files inside folder
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }
      setOriginalFolderSize(totalSize);

      setIsZipping(true);
      setZipProgress(0);

      try {
        const firstPath = files[0].webkitRelativePath;
        const folderName = firstPath ? firstPath.split("/")[0] : "folder";

        const zipped = await zipFolder({
          files,
          folderName,
          onProgress: (percent) => setZipProgress(percent),
          maxSize: folderMaxSize,
        });

        setSelectedFile(zipped);
        setIsZipping(false);
        return true;
      } catch (error: unknown) {
        console.error("Zipping failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process folder.";
        toast.error(errorMessage);
        setSelectedFile(null);
        setOriginalFolderSize(null);
        setIsZipping(false);
        return false;
      }
    },
    [maxSize]
  );

  const uploadFile = useCallback(
    async (
      uploadFn: (onProgress: (percent: number) => void) => Promise<T> | T | void
    ): Promise<T | undefined> => {
      if (!selectedFile) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await uploadFn((percent) =>
          setUploadProgress(percent)
        );
        if (response !== undefined) {
          onSuccess?.(response as T);
        }
        return response as T;
      } catch (error: unknown) {
        onError?.(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFile, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setSelectedFile(null);
    setOriginalFolderSize(null);
    setIsZipping(false);
    setZipProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  return {
    selectedFile,
    originalFolderSize,
    isZipping,
    zipProgress,
    isUploading,
    uploadProgress,
    handleFileChange,
    handleFolderChange,
    uploadFile,
    reset,
  };
};
