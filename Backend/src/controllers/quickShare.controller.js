import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import quickShareService from "../services/quickShare.service.js";

const uploadFile = AsyncHandler(async (req, res) => {
  const fileLocalPath = req.file?.path;
  const originalName = req.file?.originalname;
  const size = req.file?.size;
  const mimetype = req.file?.mimetype;
  const { expiryMinutes } = req.body;

  if (!fileLocalPath) {
    throw new ApiError(400, "File is required");
  }

  const result = await quickShareService.uploadFileService(
    fileLocalPath,
    originalName,
    size,
    mimetype,
    expiryMinutes
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "File uploaded successfully for sharing"));
});

const getFileDetails = AsyncHandler(async (req, res) => {
  const { code } = req.params;

  const result = await quickShareService.getFileDetailsService(code);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "File sharing details retrieved successfully"));
});

const quickShareController = {
  uploadFile,
  getFileDetails,
};

export default quickShareController;
