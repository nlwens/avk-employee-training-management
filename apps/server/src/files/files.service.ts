import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { StorageProviderSelector } from './providers/storage-provider.selector';
import { UploadMetadata } from './files';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File) private readonly filesRepository: Repository<File>,
    private readonly selector: StorageProviderSelector,
  ) {}

  private async findOneById(id: string): Promise<File> {
    return await this.filesRepository.findOneByOrFail({ id });
  }

  async findBySegmentId(segmentId: string): Promise<File[]> {
    return this.filesRepository.find({
      where: { segmentId },
      order: { localeCode: 'ASC' },
    });
  }

  /**
   * Upload the file, store it in a drive storage and database.
   * @param file Object containing file metadata and access information.
   * @throws BadRequestException - File was not provided.
   */
  async upload(file: UploadMetadata): Promise<File> {
    const provider = this.selector.getDefaultProvider();
    const result = await provider.uploadFile(file);

    return await this.filesRepository.save(
      this.filesRepository.create({
        name: result.originalname,
        size: result.size,
        mimetype: result.mimetype,
        localeCode: file.locale,
        segmentId: file.segmentId,
        provider: provider.getStorageProvider(),
      }),
    );
  }

  /**
   * Obtain the file by its ID.
   * @param id UUID of the file metadata.
   * @throws EntityNotFoundError - no file with the UUID exists.
   */
  async obtainOne(id: string): Promise<Buffer> {
    const file = await this.findOneById(id);
    const provider = this.selector.getProvider(file.provider);

    return await provider.obtainFile(file.name);
  }

  /**
   * Delete the file by its ID.
   * @param id UUID of the file metadata.
   * @throws EntityNotFoundError - no file with the UUID exists.
   */
  async delete(id: string): Promise<void> {
    const file = await this.findOneById(id);
    const provider = this.selector.getProvider(file.provider);

    await provider.deleteFile(file.name);

    // delete file from the database
    await this.filesRepository.delete({ id });
  }
}
