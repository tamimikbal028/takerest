import { supabase } from "../config/supabase.js";
import {
  UploadToSupabase,
  DeleteFromSupabase,
  getRelativePathFromUrl,
  getSignedUrlFromSupabase,
} from "../utils/SupabaseStorageUpload.js";
import { ApiError } from "../utils/ApiError.js";

const cleanupShareItem = async (share) => {
  const relativePath = getRelativePathFromUrl(share.file_url, "quick_share");
  if (relativePath) {
    await DeleteFromSupabase("quick_share", relativePath);
  }
  try {
    await supabase.from("quick_shares").delete().eq("id", share.id);
  } catch (err) {
    console.error(
      `Error deleting database entry for ${share.file_name}:`,
      err.message
    );
  }
};

const uploadFileService = async (
  fileLocalPath,
  originalName,
  size,
  mimetype,
  expiryMinutes = 30
) => {
  // Validate expiry time (max 60 minutes)
  const duration = Math.min(Math.max(Number(expiryMinutes) || 30, 1), 60);

  // Generate unique 5-character alphanumeric code
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const { data: existing, error: checkError } = await supabase
      .from("quick_shares")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (checkError) {
      throw new ApiError(
        500,
        checkError.message || "Failed to verify code uniqueness"
      );
    }
    if (!existing) {
      isUnique = true;
    }
  }

  // Upload to Supabase Storage
  let storageFile;
  try {
    storageFile = await UploadToSupabase(
      fileLocalPath,
      "quick_share",
      null,
      mimetype
    );
  } catch (err) {
    throw new ApiError(500, err?.message || "Storage upload failed");
  }

  if (!storageFile || !storageFile.url) {
    throw new ApiError(500, "File upload failed to generate URL");
  }

  const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

  // Save to database
  const { data: share, error: insertError } = await supabase
    .from("quick_shares")
    .insert({
      code,
      file_url: storageFile.url,
      file_name: originalName || "shared_file",
      file_size: size,
      mimetype,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !share) {
    // Cleanup transaction rollback
    const relativePath = getRelativePathFromUrl(storageFile.url, "quick_share");
    if (relativePath) {
      await DeleteFromSupabase("quick_share", relativePath);
    }
    throw new ApiError(
      500,
      insertError?.message || "Failed to create quick share entry"
    );
  }

  return {
    id: share.id,
    code: share.code,
    file_name: share.file_name,
    file_size: share.file_size,
    expires_at: share.expires_at,
  };
};

const getFileDetailsService = async (code) => {
  if (!code || code.length !== 5) {
    throw new ApiError(400, "Invalid share code. Code must be 5 characters.");
  }

  const cleanCode = code.trim().toUpperCase();

  // Fetch from database
  const { data: share, error } = await supabase
    .from("quick_shares")
    .select("*")
    .eq("code", cleanCode)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, error.message);
  }
  if (!share) {
    throw new ApiError(404, "Invalid share code or the file has expired");
  }

  // Check if expired
  const now = Date.now();
  const expiresAtMs = new Date(share.expires_at).getTime();
  if (expiresAtMs < now) {
    // Trigger lazy cleanup
    await cleanupShareItem(share);
    throw new ApiError(410, "This share code has expired");
  }

  // Calculate remaining seconds
  const remainingSeconds = Math.max(1, Math.floor((expiresAtMs - now) / 1000));

  // Generate signed URL (valid for remaining seconds)
  const relativePath = getRelativePathFromUrl(share.file_url, "quick_share");
  if (!relativePath) {
    throw new ApiError(500, "Invalid file storage path");
  }

  let signedUrl;
  try {
    signedUrl = await getSignedUrlFromSupabase(
      "quick_share",
      relativePath,
      remainingSeconds
    );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Failed to generate download URL"
    );
  }

  return {
    id: share.id,
    code: share.code,
    file_name: share.file_name,
    file_size: share.file_size,
    mimetype: share.mimetype,
    expires_at: share.expires_at,
    download_url: signedUrl,
  };
};

const cleanupExpiredShares = async () => {
  try {
    const { data: expiredShares, error } = await supabase
      .from("quick_shares")
      .select("*")
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error(
        "[QuickShare Cleanup] Error fetching expired shares:",
        error.message
      );
      return;
    }

    if (expiredShares && expiredShares.length > 0) {
      for (const share of expiredShares) {
        await cleanupShareItem(share);
      }
      console.log(
        `[QuickShare Cleanup] Successfully cleared ${expiredShares.length} expired share(s).`
      );
    }
  } catch (err) {
    console.error("[QuickShare Cleanup] Unhandled exception:", err.message);
  }
};

const quickShareService = {
  uploadFileService,
  getFileDetailsService,
  cleanupExpiredShares,
};

export default quickShareService;
