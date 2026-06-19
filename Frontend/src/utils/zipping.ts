import JSZip from "jszip";

const EXCLUDED_FOLDERS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "venv",
  ".venv",
  "__pycache__",
  ".expo",
  "out",
  ".gradle",
  "bin",
  "obj",
  ".idea",
  ".vscode",
  "target",
  "vendor",
  ".output",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".cache",
  "bower_components",
];

export interface ZipFolderOptions {
  files: FileList | File[];
  folderName: string;
  onProgress?: (percent: number) => void;
  maxSize?: number;
}

/**
 * Compress a list of files (from a folder) into a single ZIP file client-side.
 * Excludes typical heavy development/cache folders.
 */
export const zipFolder = async ({
  files,
  folderName,
  onProgress,
  maxSize,
}: ZipFolderOptions): Promise<File> => {
  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pathParts = file.webkitRelativePath.split("/");
    const shouldExclude = pathParts.some((part) =>
      EXCLUDED_FOLDERS.includes(part)
    );

    if (shouldExclude) continue;

    zip.file(file.webkitRelativePath, file);
  }

  const content = await zip.generateAsync(
    { type: "blob", compression: "STORE" },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  if (maxSize && content.size > maxSize) {
    throw new Error(
      `Folder is too large! Maximum limit is ${maxSize / (1024 * 1024)}MB.`
    );
  }

  return new File([content], `${folderName}.zip`, {
    type: "application/zip",
  });
};
