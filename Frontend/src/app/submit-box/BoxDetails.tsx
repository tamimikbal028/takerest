import {
  FaBox,
  FaDownload,
  FaFile,
  FaArrowLeft,
  FaCopy,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import boxHooks from "@/hooks/useBox";
import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { confirm } from "@/utils/sweetAlert";
import CopyLinkButton from "@/app/shared/Button/CopyLinkButton";

const BoxDetails = () => {
  const { data: boxData, isPending, error } = boxHooks.useGetBoxDetails();
  const { mutate: deleteBox, isPending: isDeleting } = boxHooks.useDeleteBox();
  const { mutate: toggleStatus, isPending: isToggling } =
    boxHooks.useToggleBoxStatus();
  const { mutate: deleteSubmission } = boxHooks.useDeleteSubmission();
  const navigate = useNavigate();
  const { boxId } = useParams();
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date">("name");

  const handleToggleStatus = () => {
    if (!boxId || !boxData) return;
    const { box } = boxData.data;
    toggleStatus({ boxId, isAccepting: !box.is_accepting });
  };

  const handleDelete = async () => {
    if (!boxId) return;

    const isConfirmed = await confirm({
      title: "Delete Box?",
      text: "This box and all its submissions will be permanently deleted. This action cannot be undone.",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      icon: "warning",
      isDanger: true,
    });

    if (isConfirmed) {
      deleteBox(boxId);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Submission?",
      text: "This student's file will be permanently deleted from database and storage. This action cannot be undone.",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      icon: "warning",
      isDanger: true,
    });

    if (isConfirmed) {
      deleteSubmission(submissionId);
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-3xl font-medium text-gray-500">
          Loading details...
        </h1>
      </div>
    );
  }

  if (error || !boxData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <FaBox className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-red-900">Error</h3>
        <p className="mt-2 text-sm font-medium text-red-500">
          {error?.message || "Failed to fetch box details"}
        </p>
      </div>
    );
  }

  const { box, submissions: rawSubmissions } = boxData.data;
  const submissions = [...rawSubmissions].sort((a, b) => {
    if (sortBy === "name") {
      return a.field_value.localeCompare(b.field_value, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    } else {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  const handleDownloadSingle = async (
    e: React.MouseEvent,
    fileUrl: string,
    fileName: string,
    submissionId: string,
    fieldValue: string
  ) => {
    e.preventDefault();
    setDownloadingId(submissionId);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fieldValue}_${fileName}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(fileUrl, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (submissions.length === 0) return;
    setIsDownloadingAll(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Chunk downloading to limit concurrency to 5 at a time
      const limit = 5;
      const chunks = [];
      for (let i = 0; i < submissions.length; i += limit) {
        chunks.push(submissions.slice(i, i + limit));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (sub) => {
            try {
              const response = await fetch(sub.file_url);
              if (!response.ok) throw new Error("Failed to fetch file");
              const blob = await response.blob();
              // Prefix the file name with the field value (e.g. StudentId_filename.zip)
              const uniqueFileName = `${sub.field_value}_${sub.file_name}`;
              zip.file(uniqueFileName, blob);
            } catch (err) {
              console.error(`Failed to download file ${sub.file_name}:`, err);
            }
          })
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${box.title || "box_submissions"}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to generate zip file:", error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          <FaArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Boxes</span>
        </button>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-400 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{box.title}</h1>
        <div className="flex items-center gap-3">
          <CopyLinkButton
            displayText={box.code}
            copyValue={box.code}
            icon={<FaCopy className="h-4 w-4 shrink-0 text-gray-700" />}
            className="flex cursor-pointer items-center justify-center gap-2 rounded border bg-amber-50 px-2 py-1 text-xl font-medium tracking-widest transition-colors hover:bg-amber-100"
          />
          <button
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              box.is_accepting
                ? "border-green-600 bg-white text-green-600 hover:bg-green-50"
                : "border-red-600 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {isToggling ? (
              <FaSpinner className="h-4 w-4 animate-spin" />
            ) : box.is_accepting ? (
              "Stop Submissions"
            ) : (
              "Start Submissions"
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-black bg-red-50 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-medium text-gray-500">
              Total {submissions.length}{" "}
              {submissions.length <= 1 ? "file" : "files"} submitted
            </p>
            <div className="w-1px hidden h-4 bg-gray-300 sm:block" />
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="text-xs font-bold tracking-wider text-gray-500 uppercase"
              >
                Sort By:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "date")}
                className="appearance-none rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-center text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Name / Roll</option>
                <option value="date">Submission Time</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || submissions.length === 0}
            className="ml-4 flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloadingAll ? (
              <FaSpinner className="h-4 w-4 animate-spin" />
            ) : (
              <FaDownload className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isDownloadingAll ? "Zipping..." : "Download All"}
            </span>
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <FaFile className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No submissions yet
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Files submitted by students will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="group flex items-center justify-between p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-lg font-medium text-gray-900">
                    {index + 1}
                  </span>

                  <div className="flex shrink-0 items-center gap-5">
                    <p
                      className="truncate font-medium text-gray-900"
                      title={submission.field_value}
                    >
                      {submission.field_value}
                    </p>

                    <p className="truncate font-medium text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                      {" - "}
                      {new Date(submission.created_at).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <button
                    onClick={(e) =>
                      handleDownloadSingle(
                        e,
                        submission.file_url,
                        submission.file_name,
                        submission.id,
                        submission.field_value
                      )
                    }
                    disabled={downloadingId === submission.id}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {downloadingId === submission.id ? (
                      <FaSpinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <FaDownload className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {downloadingId === submission.id
                        ? "Downloading..."
                        : "Download"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubmission(submission.id)}
                    className="flex shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                    title="Delete Submission"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoxDetails;
