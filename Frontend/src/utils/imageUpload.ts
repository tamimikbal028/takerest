export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp";

export const getImageValidationError = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const isValidExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension);
  const isValidMimeType = ALLOWED_IMAGE_MIME_TYPES.has(file.type);

  if (!isValidExtension || !isValidMimeType) {
    return "Only JPG, JPEG, PNG or WEBP images are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "File size must be 25MB or less.";
  }

  return null;
};

export const compressImage = (
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.75
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type === "image/png" ? "image/png" : "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type === "image/png" ? "image/png" : "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
