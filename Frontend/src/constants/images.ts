/**
 * Default Images / Placeholders
 *
 * UI Avatars API use করছি - এটা reliable এবং dynamic
 * https://ui-avatars.com/
 *
 * Features:
 * - Name থেকে initials generate করে
 * - Custom size, color support
 * - Always available (no 404)
 */

// Default avatar - যখন user এর avatar নেই
export const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=150";

// Small avatar (32px) - comments, replies
export const DEFAULT_AVATAR_SM =
  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=32";

// Extra small avatar (24px) - nested replies
export const DEFAULT_AVATAR_XS =
  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=24";

// Medium avatar (40px) - posts, cards
export const DEFAULT_AVATAR_MD =
  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=40";

// Medium-large avatar (48px) - creator section
export const DEFAULT_AVATAR_ML =
  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=48";

// Large avatar (150px) - profile page
export const DEFAULT_AVATAR_LG =
  "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&size=150";

// Default cover image
export const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop";

// Product placeholder
export const DEFAULT_PRODUCT_IMAGE =
  "https://placehold.co/300x300/e2e8f0/64748b?text=No+Image";

/**
 * Generate avatar URL with user's name initials
 * @param name - User's full name
 * @param size - Image size in pixels
 */
export const getAvatarUrl = (name: string, size: number = 40): string => {
  const encodedName = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=${size}`;
};

