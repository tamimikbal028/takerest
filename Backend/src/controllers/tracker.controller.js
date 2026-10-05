import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import trackerServices from "../services/tracker.service.js";

// 1. Categories
const getCategories = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { categories, meta } =
    await trackerServices.getCategoriesWithActivitiesService(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { categories, meta },
        "Categories fetched successfully"
      )
    );
});

const createCategory = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const categoryData = req.body;
  const { category, meta } =
    await trackerServices.createCategoryService(userId, categoryData);

  return res
    .status(201)
    .json(
      new ApiResponse(201, { category, meta }, "Category created successfully")
    );
});

const updateCategory = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updateData = req.body;
  const { category, meta } =
    await trackerServices.updateCategoryService(userId, id, updateData);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { category, meta }, "Category updated successfully")
    );
});

const deleteCategory = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { deletedId, meta } =
    await trackerServices.deleteCategoryService(userId, id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedId, meta }, "Category deleted successfully")
    );
});

// 2. Activities
const createActivity = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const activityData = req.body;
  const { activity, meta } =
    await trackerServices.createActivityService(userId, activityData);

  return res
    .status(201)
    .json(
      new ApiResponse(201, { activity, meta }, "Activity created successfully")
    );
});

const updateActivity = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updateData = req.body;
  const { activity, meta } =
    await trackerServices.updateActivityService(userId, id, updateData);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { activity, meta }, "Activity updated successfully")
    );
});

const deleteActivity = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { deletedId, meta } =
    await trackerServices.deleteActivityService(userId, id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedId, meta }, "Activity deleted successfully")
    );
});

// 3. Active Continuous Timer
const getActiveTimer = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { activeTimer, meta } =
    await trackerServices.getActiveTimerService(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { activeTimer, meta },
        "Active timer state fetched successfully"
      )
    );
});

const saveChunk = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const chunkData = req.body;
  const { savedLog, activeTimer, meta } =
    await trackerServices.saveChunkService(userId, chunkData);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { savedLog, activeTimer, meta },
        "Time chunk saved successfully"
      )
    );
});

const switchTimer = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const switchData = req.body;
  const { savedLog, activeTimer, meta } =
    await trackerServices.switchTimerService(userId, switchData);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { savedLog, activeTimer, meta },
        "Timer switched successfully"
      )
    );
});

// 4. Daily Summary & Logs
const getTodaySummary = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const date = req.query.date;
  const { logs, summary, meta } =
    await trackerServices.getTodaySummaryService(userId, date);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { logs, summary, meta },
        "Day summary and logs fetched successfully"
      )
    );
});

const deleteTimeLog = AsyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { deletedId, meta } =
    await trackerServices.deleteTimeLogService(userId, id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedId, meta }, "Time log deleted successfully")
    );
});

const trackerControllers = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createActivity,
  updateActivity,
  deleteActivity,
  getActiveTimer,
  saveChunk,
  switchTimer,
  getTodaySummary,
  deleteTimeLog,
};

export default trackerControllers;
