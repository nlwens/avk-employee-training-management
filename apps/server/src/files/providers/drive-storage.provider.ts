import { extname, resolve, sep } from 'path';
import { IFileProvider } from './file-provider.interface';
import { promises as fs } from 'fs';
import { StorageProvider } from '../enums/storage-provider.enum';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/enums/error-codes.enum';
import { FileMetadata, UploadMetadata } from '../files';
import { v4 as UUID } from 'uuid';

const DEFAULT_UPLOAD_DIR = 'data-storage/uploads';

@Injectable()
export class DriveStorageProvider implements IFileProvider {
  private readonly logger = new Logger(DriveStorageProvider.name);
  private readonly uploadDirectory: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDirectory = this.configService.get<string>(
      'FILE_UPLOAD_LOCATION',
      DEFAULT_UPLOAD_DIR,
    );
  }

  getStorageProvider(): StorageProvider {
    return StorageProvider.LOCAL;
  }

  getUploadDirectoryForFile(filename: string): string {
    return `${this.uploadDirectory}/${filename}`;
  }

  async obtainFile(filename: string): Promise<Buffer> {
    return fs.readFile(this.path(filename));
  }

  async uploadFile(file: UploadMetadata): Promise<FileMetadata> {
    // Generate a unique filename
    const uniqueFilename = `${UUID()}${extname(file.originalname)}`;

    // Generate a static storage path that will be used in the client to display files
    const uniqueFilenameWithPath =
      this.getUploadDirectoryForFile(uniqueFilename);

    await fs.mkdir(this.uploadDirectory, { recursive: true });
    await fs.writeFile(this.path(uniqueFilenameWithPath), file.buffer);

    return {
      originalname: uniqueFilenameWithPath,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await fs.unlink(this.path(filename));
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      this.logger.warn(`No such file or directory for the ${filename}`);
    }
  }

  /**
   * Validates whether the `path` is being accessed correctly
   * by converting parameter to the relative path and checking
   * whether it is not being accessed from the parent directories.
   */
  private path(filename: string) {
    const absolute = resolve(filename);
    const root = resolve(this.uploadDirectory);

    if (!absolute.startsWith(root + sep)) {
      throw new BadRequestException({
        message: 'Cannot access outside upload directory',
        code: ErrorCode.CANNOT_ACCESS_OUTSIDE_DIRECTORY,
      });
    }

    return filename;
  }
}
