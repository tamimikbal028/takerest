/**
 * Custom HTML Modals using SweetAlert2
 *
 * This file contains utilities for complex interactive modals that require
 * custom HTML and event handling. These use SweetAlert2 under the hood.
 *
 * If you want to replace SweetAlert2 with a custom modal system in the future,
 * only this file needs to be modified. The sweetAlert.ts file will remain unchanged.
 */

import Swal from "sweetalert2";
import { inputRename, confirmDelete } from "@/utils/sweetAlert";

// ============================================
// TYPES
// ============================================

export interface MenuAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "danger" | "primary";
  icon?: string; // Optional icon class or emoji
}

// ============================================
// GENERIC ACTION MENU
// ============================================

/**
 * Show a clean action menu with multiple options
 * This replaces custom HTML Swal modals with a type-safe solution
 *
 * @param title - Modal title
 * @param actions - Array of menu actions
 *
 * @example
 * await showActionMenu("Options", [
 *   { label: "Edit", onClick: () => handleEdit() },
 *   { label: "Delete", onClick: () => handleDelete(), variant: "danger" },
 * ]);
 */
export const showActionMenu = async (
  title: string,
  actions: MenuAction[]
): Promise<void> => {
  // Create HTML for buttons
  const buttonsHtml = actions
    .map((action, index) => {
      const variant = action.variant || "default";
      const colorClasses =
        variant === "danger"
          ? "border-red-100 bg-white text-red-600 hover:bg-red-50"
          : variant === "primary"
            ? "border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";

      const icon = action.icon ? `${action.icon} ` : "";

      return `<button 
        id="action-btn-${index}" 
        class="w-full px-4 py-2.5 rounded-lg border ${colorClasses} font-medium transition-colors"
      >
        ${icon}${action.label}
      </button>`;
    })
    .join("");

  await Swal.fire({
    title,
    html: `<div class="flex flex-col gap-2 min-w-[200px]">${buttonsHtml}</div>`,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: "rounded-xl",
    },
    didOpen: () => {
      const popup = Swal.getPopup();
      if (!popup) return;

      // Attach event listeners
      actions.forEach((action, index) => {
        const btn = popup.querySelector(
          `#action-btn-${index}`
        ) as HTMLButtonElement | null;

        if (btn) {
          btn.addEventListener("click", async () => {
            Swal.close();
            await action.onClick();
          });
        }
      });
    },
  });
};

// ============================================
// SPECIALIZED ACTION MENUS
// ============================================

/**
 * File/Folder action menu (Rename, Delete, Download, etc.)
 *
 * @example
 * await showFileMenu({
 *   onRename: async () => { ... },
 *   onDelete: async () => { ... },
 *   onDownload: () => { ... },
 * });
 */
export const showFileMenu = async (callbacks: {
  onRename?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onDownload?: () => void | Promise<void>;
  onDetails?: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
}) => {
  const actions: MenuAction[] = [];

  if (callbacks.onDownload)
    actions.push({ label: "Download", onClick: callbacks.onDownload });
  if (callbacks.onRename)
    actions.push({ label: "Rename", onClick: callbacks.onRename });
  if (callbacks.onDetails)
    actions.push({ label: "Details", onClick: callbacks.onDetails });
  if (callbacks.onShare)
    actions.push({ label: "Share", onClick: callbacks.onShare });
  if (callbacks.onDelete)
    actions.push({
      label: "Delete",
      onClick: callbacks.onDelete,
      variant: "danger",
    });

  await showActionMenu("Options", actions);
};

/**
 * Quick file menu with built-in rename and delete handlers
 *
 * @example
 * await showQuickFileMenu(file.name, {
 *   onRename: (newName) => updateFileName(file.id, newName),
 *   onDelete: () => deleteFile(file.id),
 * });
 */
export const showQuickFileMenu = async (
  fileName: string,
  callbacks: {
    onRename?: (newName: string) => void | Promise<void>;
    onDelete?: () => void | Promise<void>;
    onDownload?: () => void | Promise<void>;
  }
) => {
  const actions: MenuAction[] = [];

  if (callbacks.onDownload) {
    actions.push({
      label: "Download",
      onClick: callbacks.onDownload,
    });
  }

  if (callbacks.onRename) {
    const renameFn = callbacks.onRename;
    actions.push({
      label: "Rename",
      onClick: async () => {
        const newName = await inputRename(fileName);
        if (newName) {
          await renameFn(newName);
        }
      },
    });
  }

  if (callbacks.onDelete) {
    const deleteFn = callbacks.onDelete;
    actions.push({
      label: "Delete",
      variant: "danger",
      onClick: async () => {
        if (await confirmDelete(fileName)) {
          await deleteFn();
        }
      },
    });
  }

  await showActionMenu("File Options", actions);
};

/**
 * Member action menu (for Groups/Rooms)
 *
 * @example
 * await showMemberMenu("John Doe", {
 *   onRemove: async () => removeMember(userId),
 *   onMakeAdmin: async () => makeAdmin(userId),
 * });
 */
export const showMemberMenu = async (
  memberName: string,
  callbacks: {
    onRemove?: () => void | Promise<void>;
    onMakeAdmin?: () => void | Promise<void>;
    onRemoveAdmin?: () => void | Promise<void>;
    onViewProfile?: () => void | Promise<void>;
    onMessage?: () => void | Promise<void>;
  }
) => {
  const actions: MenuAction[] = [];

  if (callbacks.onViewProfile)
    actions.push({ label: "View Profile", onClick: callbacks.onViewProfile });
  if (callbacks.onMessage)
    actions.push({ label: "Send Message", onClick: callbacks.onMessage });
  if (callbacks.onMakeAdmin)
    actions.push({
      label: "Make Admin",
      onClick: callbacks.onMakeAdmin,
      variant: "primary",
    });
  if (callbacks.onRemoveAdmin)
    actions.push({
      label: "Remove Admin",
      onClick: callbacks.onRemoveAdmin,
    });
  if (callbacks.onRemove)
    actions.push({
      label: "Remove from Group",
      onClick: callbacks.onRemove,
      variant: "danger",
    });

  await showActionMenu(`${memberName} Options`, actions);
};

/**
 * Post action menu (Edit, Pin, Delete, Report, etc.)
 *
 * @example
 * await showPostMenu({
 *   onEdit: () => editPost(),
 *   onPin: () => pinPost(),
 *   onDelete: async () => deletePost(),
 * });
 */
export const showPostMenu = async (callbacks: {
  onEdit?: () => void | Promise<void>;
  onPin?: () => void | Promise<void>;
  onUnpin?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onReport?: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
}) => {
  const actions: MenuAction[] = [];

  if (callbacks.onEdit)
    actions.push({ label: "Edit Post", onClick: callbacks.onEdit });
  if (callbacks.onPin)
    actions.push({
      label: "Pin Post",
      onClick: callbacks.onPin,
      variant: "primary",
    });
  if (callbacks.onUnpin)
    actions.push({ label: "Unpin Post", onClick: callbacks.onUnpin });
  if (callbacks.onShare)
    actions.push({ label: "Share", onClick: callbacks.onShare });
  if (callbacks.onReport)
    actions.push({ label: "Report", onClick: callbacks.onReport });
  if (callbacks.onDelete)
    actions.push({
      label: "Delete Post",
      onClick: callbacks.onDelete,
      variant: "danger",
    });

  await showActionMenu("Post Options", actions);
};

/**
 * Media/File options menu (for classroom media tab)
 *
 * @example
 * await showMediaMenu(file, {
 *   onRename: (newName) => updateFile(file.id, newName),
 *   onDelete: () => deleteFile(file.id),
 * });
 */
export const showMediaMenu = async (
  fileName: string,
  callbacks: {
    onRename?: (newName: string) => void | Promise<void>;
    onDelete?: () => void | Promise<void>;
    onDownload?: () => void | Promise<void>;
    onView?: () => void | Promise<void>;
  }
) => {
  const actions: MenuAction[] = [];

  if (callbacks.onView) {
    actions.push({
      label: "View",
      onClick: callbacks.onView,
    });
  }

  if (callbacks.onDownload) {
    actions.push({
      label: "Download",
      onClick: callbacks.onDownload,
    });
  }

  if (callbacks.onRename) {
    const renameFn = callbacks.onRename;
    actions.push({
      label: "Rename",
      onClick: async () => {
        const newName = await inputRename(fileName);
        if (newName) {
          await renameFn(newName);
        }
      },
    });
  }

  if (callbacks.onDelete) {
    const deleteFn = callbacks.onDelete;
    actions.push({
      label: "Delete",
      variant: "danger",
      onClick: async () => {
        if (await confirmDelete(fileName)) {
          await deleteFn();
        }
      },
    });
  }

  await showActionMenu("File Options", actions);
};

// ============================================
// CUSTOM HTML MODALS (Advanced)
// ============================================

/**
 * Show a custom HTML modal (for very specific use cases)
 * Use the pre-built functions above when possible
 *
 * @example
 * await showCustomModal({
 *   title: "Custom Options",
 *   html: "<div>Your custom HTML here</div>",
 *   onOpen: (popup) => {
 *     // Setup event listeners
 *   },
 * });
 */
export const showCustomModal = async (config: {
  title: string;
  html: string;
  showConfirmButton?: boolean;
  showCloseButton?: boolean;
  onOpen?: (popup: HTMLElement) => void;
  onClose?: () => void;
}) => {
  await Swal.fire({
    title: config.title,
    html: config.html,
    showConfirmButton: config.showConfirmButton ?? false,
    showCloseButton: config.showCloseButton ?? true,
    customClass: {
      popup: "rounded-xl",
    },
    didOpen: () => {
      const popup = Swal.getPopup();
      if (popup && config.onOpen) {
        config.onOpen(popup);
      }
    },
    didClose: () => {
      if (config.onClose) {
        config.onClose();
      }
    },
  });
};

