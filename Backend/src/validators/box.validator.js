import Joi from "joi";

// Create box schema
const createBoxSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required().messages({
    "string.empty": "Box title is required",
    "string.min": "Box title must be at least 3 characters",
    "string.max": "Box title cannot exceed 30 characters",
  }),

  label: Joi.string().trim().max(50).optional().messages({
    "string.max": "Field label cannot exceed 50 characters",
  }),
});

// Submit file schema
const submitFileSchema = Joi.object({
  boxCode: Joi.string().trim().required().messages({
    "string.empty": "Box code is required",
  }),

  fieldValue: Joi.string().trim().required().messages({
    "string.empty": "Field value is required (e.g., Roll Number)",
  }),
});

export { createBoxSchema, submitFileSchema };
