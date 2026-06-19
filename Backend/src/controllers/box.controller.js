import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import boxService from "../services/box.service.js";

const createBox = AsyncHandler(async (req, res) => {
  const { box } = await boxService.createBoxService(req.user.id, req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, { box }, "Box created successfully"));
});

const getActiveBoxes = AsyncHandler(async (req, res) => {
  const { boxes } = await boxService.getActiveBoxesService(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { boxes }, "Active Boxes fetched successfully"));
});

const getBoxDetails = AsyncHandler(async (req, res) => {
  const { boxId } = req.params;
  const { box, submissions } = await boxService.getBoxDetailsService(
    boxId,
    req.user.id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, { box, submissions }, "Box fetched successfully")
    );
});

const submitFile = AsyncHandler(async (req, res) => {
  const { boxCode, fieldValue } = req.body;
  const fileLocalPath = req.file?.path;

  if (!fileLocalPath) {
    throw new ApiError(400, "File is required");
  }

  const { submission } = await boxService.submitFileService(
    {
      boxCode,
      fieldValue,
      originalName: req.file?.originalname,
      mimetype: req.file?.mimetype,
    },
    fileLocalPath
  );
  return res
    .status(201)
    .json(new ApiResponse(201, { submission }, "File submitted successfully"));
});

const deleteBox = AsyncHandler(async (req, res) => {
  const { boxId } = req.params;
  await boxService.deleteBoxService(req.user.id, boxId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Box deleted successfully"));
});

const toggleBoxStatus = AsyncHandler(async (req, res) => {
  const { boxId } = req.params;
  const { isAccepting } = req.body;

  if (typeof isAccepting !== "boolean") {
    throw new ApiError(400, "isAccepting is required and must be a boolean");
  }

  const { box } = await boxService.toggleBoxStatusService(
    req.user.id,
    boxId,
    isAccepting
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { box }, "Box status updated successfully"));
});

const deleteSubmission = AsyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  await boxService.deleteSubmissionService(req.user.id, submissionId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Submission deleted successfully"));
});

const boxControllers = {
  createBox,
  getActiveBoxes,
  getBoxDetails,
  submitFile,
  deleteBox,
  toggleBoxStatus,
  deleteSubmission,
};

export default boxControllers;
