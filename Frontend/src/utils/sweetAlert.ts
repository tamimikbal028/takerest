import Swal from "sweetalert2";

// ============================================
// 1. SUCCESS NOTIFICATION (Auto-close)
// ============================================
export interface SuccessOptions {
  title: string;
  text?: string;
  timer?: number; // Default: 500ms
}

export const showSuccess = async (opts: SuccessOptions) => {
  return Swal.fire({
    icon: "success",
    title: opts.title,
    text: opts.text,
    timer: opts.timer ?? 500,
    showConfirmButton: false,
  });
};

// ============================================
// 2. CONFIRMATION DIALOG (Yes/No)
// ============================================
export interface ConfirmOptions {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "info" | "success" | "error" | "question";
  isDanger?: boolean; // true = red confirm button (for delete actions)
  confirmButtonColor?: string; // Explicit color override
}

export const confirm = async (opts: ConfirmOptions) => {
  const confirmColor =
    opts.confirmButtonColor ?? (opts.isDanger ? "#d33" : "#3085d6");
  const cancelColor = opts.isDanger ? "#6b7280" : "#d33";

  const result = await Swal.fire({
    title: opts.title ?? "Are you sure?",
    text: opts.text ?? "",
    icon: opts.icon ?? "warning",
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: cancelColor,
    confirmButtonText: opts.confirmButtonText ?? "Yes",
    cancelButtonText: opts.cancelButtonText ?? "Cancel",
  });

  return result.isConfirmed;
};

// ============================================
// 3. INPUT DIALOG (Get text from user)
// ============================================
export interface InputOptions {
  title: string;
  inputPlaceholder?: string;
  inputValue?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  maxLength?: number;
  validator?: (value: string) => string | null; // Return error message or null if valid
}

export const showInput = async (opts: InputOptions): Promise<string | null> => {
  const { value } = await Swal.fire<string>({
    title: opts.title,
    input: "text",
    inputPlaceholder: opts.inputPlaceholder ?? "Enter value",
    inputValue: opts.inputValue ?? "",
    showCancelButton: true,
    confirmButtonText: opts.confirmButtonText ?? "Submit",
    cancelButtonText: opts.cancelButtonText ?? "Cancel",
    cancelButtonColor: "#d33",
    inputAttributes: {
      maxlength: opts.maxLength?.toString() ?? "100",
      autocapitalize: "off",
      autocorrect: "off",
    },
    preConfirm: (value) => {
      // Basic validation
      if (!value || !value.trim()) {
        Swal.showValidationMessage("This field is required");
        return null;
      }

      // Custom validation
      if (opts.validator) {
        const error = opts.validator(value.trim());
        if (error) {
          Swal.showValidationMessage(error);
          return null;
        }
      }

      return value.trim();
    },
  });

  return value ?? null;
};

// ============================================
// 4. ERROR MESSAGE
// ============================================
export interface ErrorOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
}

export const showError = async (opts: ErrorOptions) => {
  return Swal.fire({
    icon: "error",
    title: opts.title,
    text: opts.text,
    confirmButtonText: opts.confirmButtonText ?? "OK",
    confirmButtonColor: "#d33",
  });
};

// ============================================
// 5. WARNING MESSAGE
// ============================================
export interface WarningOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
}

export const showWarning = async (opts: WarningOptions) => {
  return Swal.fire({
    icon: "warning",
    title: opts.title,
    text: opts.text,
    confirmButtonText: opts.confirmButtonText ?? "OK",
    confirmButtonColor: "#f59e0b",
  });
};

// ============================================
// TARGET COMMON USE CASE SHORTCUTS
// ============================================

// Quick success for common actions
export const showCreateSuccess = (itemName: string) =>
  showSuccess({
    title: "Created!",
    text: `${itemName} has been created successfully`,
  });

export const showUpdateSuccess = (itemName: string) =>
  showSuccess({
    title: "Updated!",
    text: `${itemName} has been updated successfully`,
  });

export const showDeleteSuccess = (itemName: string) =>
  showSuccess({
    title: "Deleted!",
    text: `${itemName} has been deleted successfully`,
  });

export const showUploadSuccess = (count: number = 1) =>
  showSuccess({
    title: "Uploaded!",
    text: `${count} file(s) uploaded successfully`,
  });

// Quick confirm for common actions
export const confirmDelete = (itemName: string) =>
  confirm({
    title: "Delete?",
    text: `Are you sure you want to delete "${itemName}"?`,
    icon: "warning",
    confirmButtonText: "Yes, delete it",
    isDanger: true,
  });

export const confirmRemove = (itemName: string) =>
  confirm({
    title: "Remove?",
    text: `Are you sure you want to remove "${itemName}"?`,
    icon: "warning",
    confirmButtonText: "Yes, remove it",
    isDanger: true,
  });

// Quick input for common actions
export const inputFolderName = () =>
  showInput({
    title: "Create New Folder",
    inputPlaceholder: "Enter folder name",
    confirmButtonText: "Create Folder",
    maxLength: 50,
    validator: (value) => {
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(value)) {
        return "Folder name contains invalid characters";
      }
      if (value.length > 50) {
        return "Folder name must be less than 50 characters";
      }
      return null;
    },
  });

export const inputRename = (currentName: string) =>
  showInput({
    title: "Rename",
    inputPlaceholder: "Enter new name",
    inputValue: currentName,
    confirmButtonText: "Rename",
    maxLength: 100,
  });

export const inputgroup_name = () =>
  showInput({
    title: "Create New Group",
    inputPlaceholder: "Enter group name",
    confirmButtonText: "Create",
    maxLength: 100,
  });

export const inputroom_name = () =>
  showInput({
    title: "Create New Room",
    inputPlaceholder: "Enter room name",
    confirmButtonText: "Create",
    maxLength: 100,
  });

export const inputPostTitle = () =>
  showInput({
    title: "Post Title",
    inputPlaceholder: "Enter post title",
    confirmButtonText: "Continue",
    maxLength: 200,
  });

// ============================================
// MORE COMMON ACTIONS
// ============================================

// Leave/Exit confirmations
export const confirmLeave = (itemName: string) =>
  confirm({
    title: "Leave?",
    text: `Are you sure you want to leave "${itemName}"?`,
    icon: "warning",
    confirmButtonText: "Yes, leave",
    isDanger: true,
  });

export const confirmExit = () =>
  confirm({
    title: "Discard Changes?",
    text: "Your changes will not be saved",
    icon: "warning",
    confirmButtonText: "Yes, discard",
    isDanger: true,
  });

// Block/Unblock confirmations
export const confirmBlock = (user_name: string) =>
  confirm({
    title: "Block User?",
    text: `Are you sure you want to block ${user_name}?`,
    icon: "warning",
    confirmButtonText: "Yes, block",
    isDanger: true,
  });

export const confirmUnblock = (user_name: string) =>
  confirm({
    title: "Unblock User?",
    text: `Unblock ${user_name}?`,
    icon: "question",
    confirmButtonText: "Yes, unblock",
  });

// Report confirmation
export const confirmReport = (itemType: string) =>
  confirm({
    title: "Report?",
    text: `Are you sure you want to report this ${itemType}?`,
    icon: "warning",
    confirmButtonText: "Yes, report",
    isDanger: true,
  });

// Join/Accept confirmations
export const confirmJoin = (itemName: string) =>
  confirm({
    title: "Join?",
    text: `Do you want to join "${itemName}"?`,
    icon: "question",
    confirmButtonText: "Yes, join",
  });

export const confirmAccept = (user_name: string) =>
  confirm({
    title: "Accept Request?",
    text: `Accept friend request from ${user_name}?`,
    icon: "question",
    confirmButtonText: "Accept",
  });

// Save/Submit success messages
export const showSaveSuccess = () =>
  showSuccess({
    title: "Saved!",
    text: "Your changes have been saved",
  });

export const showSubmitSuccess = () =>
  showSuccess({
    title: "Submitted!",
    text: "Your submission was successful",
  });

export const showSendSuccess = () =>
  showSuccess({
    title: "Sent!",
    text: "Message sent successfully",
  });

// Specific action success messages
export const showJoinSuccess = (itemName: string) =>
  showSuccess({
    title: "Joined!",
    text: `You joined "${itemName}"`,
  });

export const showLeaveSuccess = (itemName: string) =>
  showSuccess({
    title: "Left!",
    text: `You left "${itemName}"`,
  });

export const showBlockSuccess = (user_name: string) =>
  showSuccess({
    title: "Blocked!",
    text: `${user_name} has been blocked`,
  });

export const showReportSuccess = () =>
  showSuccess({
    title: "Reported!",
    text: "Thank you for reporting",
  });

// ============================================
// COMMON ERROR MESSAGES
// ============================================

export const showNetworkError = () =>
  showError({
    title: "Network Error",
    text: "Please check your internet connection",
  });

export const showAuthError = () =>
  showError({
    title: "Authentication Failed",
    text: "Please login again",
  });

export const showPermissionError = () =>
  showError({
    title: "Permission Denied",
    text: "You don't have permission to perform this action",
  });

export const showValidationError = (message?: string) =>
  showError({
    title: "Validation Error",
    text: message ?? "Please check your input",
  });

export const showServerError = () =>
  showError({
    title: "Server Error",
    text: "Something went wrong. Please try again later",
  });

// ============================================
// INFO MESSAGE
// ============================================
export interface InfoOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
}

export const showInfo = async (opts: InfoOptions) => {
  return Swal.fire({
    icon: "info",
    title: opts.title,
    text: opts.text,
    confirmButtonText: opts.confirmButtonText ?? "OK",
    confirmButtonColor: "#3085d6",
  });
};

// ============================================
// LOADING MESSAGE (Manual close)
// ============================================
export const showLoading = (message: string = "Please wait...") => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeLoading = () => {
  Swal.close();
};

// ============================================
// ARCADE GAMING ALERTS
// ============================================

export const confirmArcadeToken = async (cost: number = 1) => {
  const result = await Swal.fire({
    title: "Start Mission?",
    text: `Playing this game will cost ${cost} Token${cost > 1 ? "s" : ""}. Proceed?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#0284c7", // Sky blue to match the standard premium theme
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, Start Mission",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "rounded-2xl",
    },
  });

  return result.isConfirmed;
};

export const showNoTokensError = () => {
  return Swal.fire({
    title: "Out of Tokens!",
    text: "You don't have enough Tokens to start this mission. Earn more by playing or wait for the daily refill.",
    icon: "error",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "Got it",
    customClass: {
      popup: "rounded-2xl",
    },
  });
};

// Default export for backwards compatibility
export default confirm;

