import { rmSync } from 'fs';
import { DriveStorageProvider } from './drive-storage.provider';
import { ConfigService } from '@nestjs/config';
import { FileMetadata } from '../files';

describe('DriveStorageProvider', () => {
  let provider: DriveStorageProvider;
  let mockConfigService: ConfigService;

  beforeAll(() => {
    mockConfigService = {
      get: () => './data-storage/uploads',
    } as unknown as ConfigService;

    provider = new DriveStorageProvider(mockConfigService);
  });

  afterAll(() => {
    rmSync('./data-storage', { recursive: true, force: true });
  });

  it('should upload file and retrieve data', async () => {
    const mockFile = {
      originalname: 'test.mp4',
      buffer: Buffer.from('video content'),
      size: 65325,
      mimetype: 'video/mp4',
    } as FileMetadata;

    const uploaded = await provider.uploadFile(mockFile);
    const retrieved = await provider.obtainFile(uploaded.originalname);

    expect(retrieved.toString()).toBe('video content');
  });

  it('should delete an uploaded file', async () => {
    const mockFile = {
      originalname: 'delete-me.pdf',
      buffer: Buffer.from('pdf content'),
      size: 11,
      mimetype: 'application/pdf',
    } as FileMetadata;

    const uploaded = await provider.uploadFile(mockFile);

    const beforeDelete = await provider.obtainFile(uploaded.originalname);
    expect(beforeDelete).toBeDefined();

    await provider.deleteFile(uploaded.originalname);
    await expect(provider.obtainFile(uploaded.originalname)).rejects.toThrow(
      'ENOENT',
    );
  });

  it('should prevent directory traversal attacks', async () => {
    await expect(provider.obtainFile('../../../etc/passwd')).rejects.toThrow(
      'Cannot access outside upload directory',
    );

    await expect(provider.deleteFile('../../../secret.txt')).rejects.toThrow(
      'Cannot access outside upload directory',
    );
  });
});
