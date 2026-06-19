import type { BoxFormData } from "@/app/submit-box/CreateBoxForm";
import api from "@/config/axios";
import type { ApiResponse } from "@/types";
import type { Box, Submission } from "@/types/box.types";
import type { AxiosProgressEvent } from "axios";

const createBox = async (
  boxData: BoxFormData
): Promise<ApiResponse<{ box: Box }>> => {
  const response = await api.post("/boxes/create", boxData);
  return response.data;
};

const getActiveBoxes = async (): Promise<ApiResponse<{ boxes: Box[] }>> => {
  const response =
    await api.get<ApiResponse<{ boxes: Box[] }>>("/boxes/active");
  return response.data;
};

const getBoxDetails = async (
  boxId: string
): Promise<ApiResponse<{ box: Box; submissions: Submission[] }>> => {
  const response = await api.get<
    ApiResponse<{ box: Box; submissions: Submission[] }>
  >(`/boxes/box/${boxId}`);
  return response.data;
};

const deleteBox = async (boxId: string): Promise<ApiResponse<object>> => {
  const response = await api.delete(`/boxes/${boxId}`);
  return response.data;
};

const submitFile = async (
  formData: FormData,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<ApiResponse<{ box: Box }>> => {
  const response = await api.post("/boxes/submit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 120000, // 120 seconds timeout for large file/folder uploads
    onUploadProgress,
  });
  return response.data;
};

const toggleBoxStatus = async (
  boxId: string,
  isAccepting: boolean
): Promise<ApiResponse<{ box: Box }>> => {
  const response = await api.patch(`/boxes/box/${boxId}/toggle-status`, {
    isAccepting,
  });
  return response.data;
};

const deleteSubmission = async (
  submissionId: string
): Promise<ApiResponse<object>> => {
  const response = await api.delete(`/boxes/submission/${submissionId}`);
  return response.data;
};

const boxServices = {
  createBox,
  getActiveBoxes,
  getBoxDetails,
  deleteBox,
  submitFile,
  toggleBoxStatus,
  deleteSubmission,
} as const;

export default boxServices;
