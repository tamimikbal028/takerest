import { useState, type ImgHTMLAttributes } from "react";
import {
  getAvatarFallbackClassName,
  getCoverFallbackClassName,
  getInitials,
  hasImageSource,
  isNameMissing,
  NOT_FOUND_FALLBACK_CLASS,
} from "../../utils/imageFallback";

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

type BaseImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  name?: string | null;
  fallbackClassName?: string;
  textClassName?: string;
};

/** Ghost silhouette icon shown when user is not found */
const GhostUserIcon = ({ size = 40 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.25)" />
    <path
      d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* diagonal slash */}
    <line
      x1="4"
      y1="4"
      x2="20"
      y2="20"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Compact ghost icon for cover fallback */
const GhostUserIconLarge = () => (
  <svg
    width={64}
    height={64}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.2)" />
    <path
      d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="4"
      y1="4"
      x2="20"
      y2="20"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const AvatarImage = ({
  src,
  name,
  alt,
  className,
  fallbackClassName,
  textClassName,
  onError,
  ...imgProps
}: BaseImageProps) => {
  const [hasError, setHasError] = useState(false);
  const label = alt ?? name ?? "Avatar";
  const notFound = isNameMissing(name);

  if (hasImageSource(src) && !hasError) {
    return (
      <img
        {...imgProps}
        src={src}
        alt={label}
        className={className}
        onError={(event) => {
          setHasError(true);
          onError?.(event);
        }}
      />
    );
  }

  if (notFound) {
    return (
      <div
        role="img"
        aria-label="User not found"
        title="User not found"
        className={joinClasses(
          "flex items-center justify-center overflow-hidden select-none",
          NOT_FOUND_FALLBACK_CLASS,
          className,
          fallbackClassName
        )}
      >
        <GhostUserIcon size={Math.round(24)} />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={joinClasses(
        "flex items-center justify-center overflow-hidden text-white select-none",
        getAvatarFallbackClassName(name),
        className,
        fallbackClassName
      )}
    >
      <span className={joinClasses("font-semibold uppercase", textClassName)}>
        {getInitials(name)}
      </span>
    </div>
  );
};

export const CoverImage = ({
  src,
  name,
  alt,
  className,
  fallbackClassName,
  textClassName,
  onError,
  ...imgProps
}: BaseImageProps) => {
  const [hasError, setHasError] = useState(false);
  const label = alt ?? name ?? "Cover image";
  const notFound = isNameMissing(name);

  if (hasImageSource(src) && !hasError) {
    return (
      <img
        {...imgProps}
        src={src}
        alt={label}
        className={className}
        onError={(event) => {
          setHasError(true);
          onError?.(event);
        }}
      />
    );
  }

  if (notFound) {
    return (
      <div
        role="img"
        aria-label="User not found"
        title="User not found"
        className={joinClasses(
          "flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden",
          NOT_FOUND_FALLBACK_CLASS,
          className,
          fallbackClassName
        )}
      >
        <GhostUserIconLarge />
        <span className="text-xs font-medium tracking-widest text-white/40 uppercase">
          Not Found
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={joinClasses(
        "flex h-full w-full items-center justify-center overflow-hidden text-white",
        getCoverFallbackClassName(name),
        className,
        fallbackClassName
      )}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <span
          className={joinClasses(
            "text-4xl font-bold tracking-wide text-white/95 uppercase",
            textClassName
          )}
        >
          {getInitials(name, 1)}
        </span>
        {name && (
          <span className="max-w-full truncate text-xs font-medium tracking-[0.2em] text-white/80 uppercase">
            {name}
          </span>
        )}
      </div>
    </div>
  );
};
