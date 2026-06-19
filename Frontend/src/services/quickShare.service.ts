import api from "@/config/axios";
import type { AxiosProgressEvent } from "axios";
import type { ApiResponse } from "@/types";

export interface QuickShareUploadResponse {
  id: string;
  code: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}

export interface QuickShareDownloadResponse {
  id: string;
  code: string;
  file_name: string;
  file_size: number;
  mimetype: string;
  expires_at: string;
  download_url: string;
}

const uploadFile = async (
  formData: FormData,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<ApiResponse<QuickShareUploadResponse>> => {
  const response = await api.post<ApiResponse<QuickShareUploadResponse>>(
    "/quick-share/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 0,
      onUploadProgress,
    }
  );
  return response.data;
};

const getFileDetails = async (
  code: string
): Promise<ApiResponse<QuickShareDownloadResponse>> => {
  const cleanCode = code.trim().toUpperCase();
  const response = await api.get<ApiResponse<QuickShareDownloadResponse>>(
    `/quick-share/download/${cleanCode}`
  );
  return response.data;
};

const quickShareServices = {
  uploadFile,
  getFileDetails,
} as const;

export default quickShareServices;
