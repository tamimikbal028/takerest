import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadAny } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBoxSchema,
  submitFileSchema,
} from "../validators/box.validator.js";
import boxControllers from "../controllers/box.controller.js";

const router = Router();

// Public routes (Anyone can access)
router
  .route("/submit")
  .post(
    uploadAny.single("file"),
    validate(submitFileSchema),
    boxControllers.submitFile
  );

// Protected routes (Box Owners)
router.use(verifyJWT);
router
  .route("/create")
  .post(validate(createBoxSchema), boxControllers.createBox);
router.route("/active").get(boxControllers.getActiveBoxes);
router.route("/box/:boxId").get(boxControllers.getBoxDetails);
router
  .route("/box/:boxId/toggle-status")
  .patch(boxControllers.toggleBoxStatus);

router.route("/:boxId").delete(boxControllers.deleteBox);
router.route("/submission/:submissionId").delete(boxControllers.deleteSubmission);

export default router;
