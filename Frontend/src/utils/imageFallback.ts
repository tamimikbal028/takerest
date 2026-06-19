const IMAGE_GRADIENTS = [
  "bg-gradient-to-br from-blue-700 to-sky-400",
  "bg-gradient-to-br from-teal-700 to-cyan-400",
  "bg-gradient-to-br from-orange-700 to-amber-400",
  "bg-gradient-to-br from-violet-700 to-fuchsia-400",
  "bg-gradient-to-br from-rose-700 to-pink-400",
  "bg-gradient-to-br from-indigo-700 to-blue-400",
];

/** Dark charcoal background shown when the user/entity does not exist */
export const NOT_FOUND_FALLBACK_CLASS =
  "bg-gradient-to-br from-gray-900 to-slate-700";

/** Returns true when name is null, undefined, empty, or the sentinel "Not found" */
export const isNameMissing = (name?: string | null): boolean =>
  !name || name.trim() === "" || name.trim().toLowerCase() === "not found";

const getPalette = (seed?: string | null) => {
  const normalizedSeed = (seed || "?").trim();
  let hash = 0;

  for (const character of normalizedSeed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return IMAGE_GRADIENTS[hash % IMAGE_GRADIENTS.length];
};

export const hasImageSource = (src?: string | null): src is string =>
  Boolean(src && src.trim());

export const getInitials = (name?: string | null, maxLetters = 2): string => {
  const normalizedName = (name || "Unknown").trim();

  if (!normalizedName) {
    return "U";
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, maxLetters).toUpperCase();
  }

  return parts
    .slice(0, maxLetters)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const getAvatarFallbackClassName = (seed?: string | null): string =>
  getPalette(seed);

export const getCoverFallbackClassName = (seed?: string | null): string =>
  getPalette(seed);
