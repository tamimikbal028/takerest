import { Router } from "express";
import { uploadQuickShare } from "../middlewares/multer.middleware.js";
import quickShareController from "../controllers/quickShare.controller.js";

const router = Router();

// Public routes (no auth required)
router
  .route("/upload")
  .post(uploadQuickShare.single("file"), quickShareController.uploadFile);
router.route("/download/:code").get(quickShareController.getFileDetails);

export default router;
