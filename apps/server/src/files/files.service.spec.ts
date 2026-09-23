import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityNotFoundError } from 'typeorm';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';
import { MimeType, UploadMetadata } from './files';
import { StorageProvider } from './enums/storage-provider.enum';
import { StorageProviderSelector } from './providers/storage-provider.selector';

const mockFile: Partial<File> = {
  id: 'uuid-1',
  name: 'document.pdf',
  size: 1024,
  mimetype: MimeType.PDF,
  provider: StorageProvider.LOCAL,
  createdAt: new Date(),
  updatedAt: new Date(),
  segmentId: 'segment-1-id',
  localeCode: 'en',
};

const mockMulterFile = {
  originalname: 'document.pdf',
  buffer: Buffer.from('pdf content'),
  size: 1024,
  mimetype: 'application/pdf',
} as UploadMetadata;

const mockStorageResult = {
  name: 'document.pdf',
  size: 1024,
  mimetype: 'application/pdf',
  provider: StorageProvider.LOCAL,
};

describe('FilesService', () => {
  let service: FilesService;

  const mockRepository = {
    findOneByOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockStorage = {
    uploadFile: jest.fn(),
    obtainFile: jest.fn(),
    deleteFile: jest.fn(),
    getStorageProvider: jest.fn(),
  };

  const mockSelector = {
    getDefaultProvider: jest.fn(),
    getProvider: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getRepositoryToken(File), useValue: mockRepository },
        { provide: StorageProviderSelector, useValue: mockSelector },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);

    mockSelector.getDefaultProvider.mockReturnValue(mockStorage);
    mockSelector.getProvider.mockReturnValue(mockStorage);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('should upload a file and persist its metadata', async () => {
      mockStorage.uploadFile.mockResolvedValue(mockStorageResult);
      mockRepository.create.mockReturnValue(mockFile);
      mockRepository.save.mockResolvedValue(mockFile);

      const result = await service.upload(mockMulterFile);

      expect(mockSelector.getDefaultProvider).toHaveBeenCalled();
      expect(mockStorage.uploadFile).toHaveBeenCalledWith(mockMulterFile);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockFile);
    });

    it('should attempt to delete the binary if the DB save fails', async () => {
      mockStorage.uploadFile.mockResolvedValue(mockStorageResult);
      mockRepository.create.mockReturnValue(mockFile);
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(service.upload(mockMulterFile)).rejects.toThrow('DB error');
    });
  });

  describe('obtainOne', () => {
    it('should return a Buffer with correct metadata', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockFile);
      mockStorage.obtainFile.mockResolvedValue(Buffer.from('pdf content'));

      const result = await service.obtainOne('uuid-1');

      expect(mockSelector.getProvider).toHaveBeenCalledWith(
        StorageProvider.LOCAL,
      );
      expect(mockStorage.obtainFile).toHaveBeenCalledWith(mockFile.name);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw when the file record does not exist', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(
        new EntityNotFoundError(File, {}),
      );

      await expect(service.obtainOne('missing')).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('should delete the binary and the metadata record', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockFile);
      mockStorage.deleteFile.mockResolvedValue(undefined);

      await service.delete('uuid-1');

      expect(mockSelector.getProvider).toHaveBeenCalledWith(
        StorageProvider.LOCAL,
      );
      expect(mockStorage.deleteFile).toHaveBeenCalledWith(mockFile.name);
    });

    it('should throw when the file record does not exist', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(
        new EntityNotFoundError(File, {}),
      );

      await expect(service.delete('missing')).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
});
