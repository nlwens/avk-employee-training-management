import { FileMetadata, UploadMetadata } from '../files';
import { StorageProvider } from '../enums/storage-provider.enum';
import { File } from '../entities/file.entity';

/**
 * Interface for file storage providers.
 *
 * Defines the contract that all storage providers must implement,
 * allowing the application to support different storage servers
 * (local drive, S3, etc.) without changing the service code.
 *
 * All implementations should also include a check for
 * an attempt to access a file outside of the upload
 * directory to prevent path traversal attacks.
 * Referenece: https://owasp.org/www-community/attacks/Path_Traversal
 *
 * Usage:
 * ```
 * class LocalStorageProvider implements IFileStorageProvider { ... }
 * class S3StorageProvider implements IFileStorageProvider { ... }
 * ```
 */
export interface IFileProvider {
  /**
   * Returns a file from a storage by its `path`, which is
   * a unique identifier used to get a buffer containing
   * the file contents.
   *
   * @param fileName is a unique identifier used to obtain a specific file
   */
  obtainFile: (fileName: string) => Promise<Buffer>;

  /**
   * Uploads a file to storage and returns its metadata.
   *
   * The implementation should:
   * 1. Generate a unique filename to avoid collisions
   * 2. Store the file in a secure location
   * 3. Return metadata that will be persisted in the database
   *
   * @param file object containing the uploaded file metadata
   * @returns promise that resolves to `FileMetadata` with name, size, mimetype and a buffer.
   *
   * ```
   * const metadata = await provider.uploadFile(File);
   * ```
   */
  uploadFile: (file: UploadMetadata) => Promise<FileMetadata>;

  /**
   * Deletes a specific file from a dedicated storage provider
   * by its `path`.
   *
   * @param fileName is a unique identifier used to obtain a specific file
   */
  deleteFile: (fileName: string) => Promise<void>;

  /**
   * Returns a storage provider (enum type) associated with the provider class implementation.
   */
  getStorageProvider: () => StorageProvider;

  /**
   * Returns base url for the specific provider.
   *
   * Example:
   * ```
   * uploads/file-name.pdf
   * ```
   */
  getUploadDirectoryForFile: (filename: string) => string;
}
