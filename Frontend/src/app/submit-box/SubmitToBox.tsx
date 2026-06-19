import { FaUpload, FaFile, FaFolder, FaSpinner } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import boxHooks from "@/hooks/useBox";
import { useFileUploader } from "@/hooks/useFileUploader";
import FileUploadProgress from "@/app/shared/upload/FileUploadProgress";

const submitBoxSchema = z.object({
  boxCode: z
    .string()
    .min(6, "Box code must be 6 characters")
    .max(6, "Box code must be 6 characters")
    .toUpperCase(),
  fieldValue: z
    .string()
    .min(1, "Field value is required")
    .max(100, "Field value cannot exceed 100 characters"),
});

export type SubmitBoxFormData = z.infer<typeof submitBoxSchema>;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const SubmitToBox = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: submitFile, isPending } = boxHooks.useSubmitFile();

  const {
    selectedFile,
    originalFolderSize,
    isZipping,
    zipProgress,
    isUploading,
    uploadProgress,
    handleFileChange,
    handleFolderChange,
    uploadFile,
    reset: resetUploader,
  } = useFileUploader({ maxSize: MAX_SIZE });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<SubmitBoxFormData>({
    resolver: zodResolver(submitBoxSchema),
    defaultValues: {
      boxCode: "",
      fieldValue: "",
    },
  });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const ok = handleFileChange(files[0]);
      if (!ok && fileInputRef.current) fileInputRef.current.value = "";
    } else {
      // Multiple files selected — zip them together
      const ok = await handleFolderChange(files);
      if (!ok && fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const ok = await handleFolderChange(files);
    if (!ok && folderInputRef.current) folderInputRef.current.value = "";
  };

  const onSubmit = async (data: SubmitBoxFormData) => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("boxCode", data.boxCode);
    formData.append("fieldValue", data.fieldValue);
    formData.append("file", selectedFile);

    try {
      await uploadFile(async (onProgress) => {
        await submitFile({
          formData,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) /
                (progressEvent.total || progressEvent.loaded)
            );
            onProgress(percentCompleted);
          },
        });
      });
      resetForm();
      resetUploader();
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    } catch (error) {
      // Error is handled by mutateAsync's query hooks onError (which toast errors)
      console.error("Submission failed:", error);
    }
  };

  const handleClear = () => {
    resetForm();
    resetUploader();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FaUpload className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Submit to Box</h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Enter box code and upload your file
          </p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Box Code<span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          {...register("boxCode")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium tracking-widest uppercase ring-blue-200 transition outline-none focus:ring-2"
          placeholder="Enter box code"
          maxLength={6}
        />
        {errors.boxCode && (
          <span className="mt-1 block text-xs font-medium text-red-600">
            {errors.boxCode.message}
          </span>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Field Value<span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          {...register("fieldValue")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ring-blue-200 transition outline-none focus:ring-2"
          placeholder="Enter your roll number, name, or ID"
          maxLength={100}
        />
        {errors.fieldValue && (
          <span className="mt-1 block text-xs font-medium text-red-600">
            {errors.fieldValue.message}
          </span>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          File or Folder{" "}
          <span className="text-xs font-medium text-red-500">( Max 50MB )</span>{" "}
          <span className="text-red-500"> *</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            disabled={isZipping || isPending}
          >
            <FaFile className="h-4 w-4" />
            Choose File
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            disabled={isZipping || isPending}
          >
            <FaFolder className="h-4 w-4" />
            Choose Folder
          </button>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            onChange={onFileChange}
            className="hidden"
            multiple
          />
          <input
            ref={folderInputRef}
            id="folder-input"
            type="file"
            onChange={onFolderChange}
            className="hidden"
            {...({
              webkitdirectory: "",
              directory: "",
            } as Record<string, string>)}
          />
          {isZipping && (
            <div className="mt-2 w-full min-w-[250px]">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span className="flex items-center gap-1.5">
                  <FaSpinner className="animate-spin" />
                  Zipping folder...
                </span>
                <span>{zipProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-50">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-150 ease-out"
                  style={{ width: `${zipProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {selectedFile && !isZipping && (
            <div className="flex min-w-[200px] flex-col gap-0.5 border-l-2 border-blue-500 pl-3">
              <span className="line-clamp-1 text-sm font-semibold text-gray-800">
                {selectedFile.name}
              </span>
              {originalFolderSize !== null ? (
                <div className="flex flex-col text-xs font-medium text-gray-500">
                  <span>
                    Actual Folder Size: {formatFileSize(originalFolderSize)}
                  </span>
                  <span className="text-blue-600">
                    Zipped Upload Size: {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-gray-500">
                  File Size: {formatFileSize(selectedFile.size)}
                </span>
              )}
            </div>
          )}
        </div>
        {!selectedFile && !isZipping && (
          <p className="mt-1 text-xs font-medium text-gray-500">
            No file or folder selected.
          </p>
        )}

        <FileUploadProgress
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          disabled={isPending || isZipping || isUploading}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isPending || isZipping || isUploading || !selectedFile}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading
            ? "Uploading..."
            : isPending
              ? "Submitting..."
              : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default SubmitToBox;
