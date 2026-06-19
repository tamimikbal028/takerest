import React, { useState } from "react";
import { FaUpload, FaDownload, FaShareAlt } from "react-icons/fa";
import QuickShareSend from "@/app/quick-share/QuickShareSend";
import QuickShareReceive from "@/app/quick-share/QuickShareReceive";

interface QuickShareWidgetProps {
  initialTab?: "send" | "receive";
}

const QuickShareWidget: React.FC<QuickShareWidgetProps> = ({
  initialTab = "send",
}) => {
  const [activeTab, setActiveTab] = useState<"send" | "receive">(initialTab);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-blue-50 text-blue-600 shadow-sm">
          <FaShareAlt className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Instant Quick Share
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-gray-500">
            Upload files up to 500MB and download them instantly via a 5-digit
            code without logging in.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab("send")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all duration-250 ${
            activeTab === "send"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:bg-white/40 hover:text-gray-900"
          }`}
        >
          <FaUpload className="h-3.5 w-3.5" />
          Send File
        </button>
        <button
          onClick={() => setActiveTab("receive")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all duration-250 ${
            activeTab === "receive"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:bg-white/40 hover:text-gray-900"
          }`}
        >
          <FaDownload className="h-3.5 w-3.5" />
          Receive File
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "send" ? <QuickShareSend /> : <QuickShareReceive />}
      </div>
    </div>
  );
};

export default QuickShareWidget;
