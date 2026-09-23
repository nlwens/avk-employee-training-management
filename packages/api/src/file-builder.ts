import {
  FileStorageProvider,
  type FileStorageProviderType,
} from "./types/segment-files";

interface FileBuildMetadata {
  // file name that also contains a full path to the file storage.
  filename: string;

  // file provider that is stored for each file (e.g., local, S3, etc.).
  provider: FileStorageProviderType;
}

/**
 * Builder for building file URLs based on the storage provider.
 *
 * The `filename` stored in the database already contains the full relative
 * path to the file (e.g. `data-storage/uploads/<uuid>.pdf`), so combining
 * it with the API base URL produces a directly accessible link.
 */
export function buildFileUrl({
  filename,
  provider,
}: FileBuildMetadata): string {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (provider === FileStorageProvider.LOCAL) {
    return `${apiUrl}/${filename}`;
  }

  return filename;
}
