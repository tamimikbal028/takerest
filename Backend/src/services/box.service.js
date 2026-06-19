import { supabase } from "../config/supabase.js";
import {
  UploadToSupabase,
  DeleteFromSupabase,
  getRelativePathFromUrl,
} from "../utils/SupabaseStorageUpload.js";
import { ApiError } from "../utils/ApiError.js";

const mapBoxRowToApi = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    field_label: row.field_label,
    created_by: row.created_by_id,
    is_accepting: row.is_accepting,
    submissions_count: row.box_submissions?.length ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const mapBoxSubmissionRowToApi = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    box_id: row.box_id,
    field_value: row.field_value,
    file_url: row.file_url,
    file_name: row.file_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const createBoxService = async (userId, data) => {
  const { title, label } = data;

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check database to ensure uniqueness
    const { data: existing, error } = await supabase
      .from("boxes")
      .select("id")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) {
      throw new ApiError(500, error.message);
    }
    if (!existing) {
      isUnique = true;
    }
  }

  const { data: box, error: insertError } = await supabase
    .from("boxes")
    .insert({
      title,
      code: code.toUpperCase(),
      field_label: label || "Roll Number",
      created_by_id: userId,
    })
    .select()
    .single();

  if (insertError || !box) {
    throw new ApiError(500, insertError?.message || "Failed to create box");
  }

  return { box: mapBoxRowToApi(box) };
};

const getActiveBoxesService = async (userId) => {
  const { data: boxes, error } = await supabase
    .from("boxes")
    .select("*, box_submissions(id)")
    .eq("created_by_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(500, error.message);
  }

  return { boxes: (boxes || []).map(mapBoxRowToApi) };
};

const getBoxDetailsService = async (boxId, userId) => {
  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("*")
    .eq("id", boxId)
    .maybeSingle();

  if (boxError) {
    throw new ApiError(500, boxError.message);
  }
  if (!box) {
    throw new ApiError(404, "Box not found");
  }

  // Check box ownership
  if (box.created_by_id !== userId) {
    throw new ApiError(
      403,
      "You are not authorized to view this box's details"
    );
  }

  const { data: submissions, error: subError } = await supabase
    .from("box_submissions")
    .select("*")
    .eq("box_id", boxId);

  if (subError) {
    throw new ApiError(500, subError.message);
  }

  // Generate transient Signed URLs for submissions in bulk
  const mappedSubmissions = (submissions || []).map(mapBoxSubmissionRowToApi);
  const signedRequests = [];

  mappedSubmissions.forEach((sub) => {
    const relativePath = getRelativePathFromUrl(sub.file_url, "boxes");
    if (relativePath) {
      signedRequests.push({ sub, relativePath });
    }
  });

  if (signedRequests.length > 0) {
    const relativePaths = signedRequests.map((r) => r.relativePath);
    const { data: signedData, error: signError } = await supabase.storage
      .from("boxes")
      .createSignedUrls(relativePaths, 3600);

    if (!signError && signedData) {
      signedRequests.forEach((req, index) => {
        const item = signedData.find((_, dIdx) => dIdx === index);
        if (item && item.signedUrl) {
          req.sub.file_url = item.signedUrl;
        }
      });
    }
  }

  return {
    box: mapBoxRowToApi(box),
    submissions: mappedSubmissions,
  };
};

const submitFileService = async (data, fileLocalPath) => {
  const { boxCode, fieldValue, originalName, mimetype } = data;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      boxCode
    );
  let queryBuilder = supabase.from("boxes").select("*");
  if (isUuid) {
    queryBuilder = queryBuilder.eq("id", boxCode);
  } else {
    queryBuilder = queryBuilder.eq("code", boxCode.toUpperCase());
  }

  const { data: box, error } = await queryBuilder.maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }
  if (!box) {
    throw new ApiError(404, "Box not found");
  }

  if (!box.is_accepting) {
    throw new ApiError(400, "Submissions are currently closed for this box");
  }

  // Upload to Supabase Storage
  let file;
  try {
    file = await UploadToSupabase(fileLocalPath, "boxes", box.id, mimetype);
  } catch (err) {
    throw new ApiError(500, err?.message || "File upload failed");
  }

  if (!file || !file.url) {
    throw new ApiError(500, "File upload failed");
  }

  const { data: submission, error: subError } = await supabase
    .from("box_submissions")
    .insert({
      box_id: box.id,
      field_value: fieldValue,
      file_url: file.url,
      file_name: originalName || "submission_file",
    })
    .select()
    .single();

  if (subError || !submission) {
    // Transaction Cleanup: Database insert failed, delete the uploaded file from storage
    const relativePath = getRelativePathFromUrl(file.url, "boxes");
    if (relativePath) {
      try {
        await supabase.storage.from("boxes").remove([relativePath]);
      } catch (cleanupErr) {
        console.error(
          "Failed to clean up storage file after db insert failure:",
          cleanupErr.message
        );
      }
    }
    throw new ApiError(500, subError?.message || "Failed to create submission");
  }

  return { submission: mapBoxSubmissionRowToApi(submission) };
};

const deleteBoxService = async (userId, boxId) => {
  const { data: box, error: fetchError } = await supabase
    .from("boxes")
    .select("id")
    .eq("id", boxId)
    .eq("created_by_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new ApiError(500, fetchError.message);
  }
  if (!box) {
    throw new ApiError(404, "Box not found");
  }

  // 1. Fetch all submissions for this box to get their file URLs
  const { data: submissions, error: subError } = await supabase
    .from("box_submissions")
    .select("file_url")
    .eq("box_id", boxId);

  if (subError) {
    throw new ApiError(
      500,
      subError.message || "Failed to fetch submissions for storage cleanup"
    );
  }

  // 2. Extract relative paths and delete them from Supabase Storage in bulk
  if (submissions && submissions.length > 0) {
    const pathsToDelete = submissions
      .map((sub) => getRelativePathFromUrl(sub.file_url, "boxes"))
      .filter(Boolean);

    if (pathsToDelete.length > 0) {
      try {
        const { error: storageError } = await supabase.storage
          .from("boxes")
          .remove(pathsToDelete);
        if (storageError) {
          console.error(
            "Storage delete error on box deletion:",
            storageError.message
          );
        }
      } catch (err) {
        console.error("Failed to clean up storage files:", err.message);
      }
    }
  }

  // 3. Delete the box from database (cascades to delete submissions table records)
  const { error: deleteError } = await supabase
    .from("boxes")
    .delete()
    .eq("id", boxId);

  if (deleteError) {
    throw new ApiError(500, deleteError.message || "Failed to delete box");
  }

  return {};
};

const toggleBoxStatusService = async (userId, boxId, isAccepting) => {
  // 1. Fetch box and check ownership
  const { data: box, error: fetchError } = await supabase
    .from("boxes")
    .select("id, created_by_id")
    .eq("id", boxId)
    .maybeSingle();

  if (fetchError) {
    throw new ApiError(500, fetchError.message);
  }
  if (!box) {
    throw new ApiError(404, "Box not found");
  }

  if (box.created_by_id !== userId) {
    throw new ApiError(403, "You are not authorized to update this box status");
  }

  // 2. Update is_accepting
  const { data: updatedBox, error: updateError } = await supabase
    .from("boxes")
    .update({ is_accepting: isAccepting })
    .eq("id", boxId)
    .select()
    .single();

  if (updateError || !updatedBox) {
    throw new ApiError(
      500,
      updateError?.message || "Failed to update box status"
    );
  }

  return { box: mapBoxRowToApi(updatedBox) };
};

const deleteSubmissionService = async (userId, submissionId) => {
  // 1. Fetch submission and its box to verify ownership
  const { data: submission, error: subError } = await supabase
    .from("box_submissions")
    .select("*, boxes:box_id(created_by_id)")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) {
    throw new ApiError(500, subError.message);
  }
  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  // Check box ownership
  if (submission.boxes?.created_by_id !== userId) {
    throw new ApiError(403, "You are not authorized to delete this submission");
  }

  // 2. Delete file from Supabase Storage
  const relativePath = getRelativePathFromUrl(submission.file_url, "boxes");
  if (relativePath) {
    try {
      const { error: storageError } = await supabase.storage
        .from("boxes")
        .remove([relativePath]);
      if (storageError) {
        console.error(
          "Storage delete error on single submission deletion:",
          storageError.message
        );
      }
    } catch (err) {
      console.error("Failed to clean up storage file:", err.message);
    }
  }

  // 3. Delete submission from database
  const { error: deleteError } = await supabase
    .from("box_submissions")
    .delete()
    .eq("id", submissionId);

  if (deleteError) {
    throw new ApiError(
      500,
      deleteError.message || "Failed to delete submission"
    );
  }

  return {};
};

const boxServices = {
  createBoxService,
  getActiveBoxesService,
  getBoxDetailsService,
  submitFileService,
  deleteBoxService,
  toggleBoxStatusService,
  deleteSubmissionService,
};

export default boxServices;
