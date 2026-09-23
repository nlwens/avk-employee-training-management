import { Injectable } from '@nestjs/common';
import { Segment } from './entities/segment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SegmentTranslation } from './entities/segment-translation.entity';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { FilesService } from '@/files/files.service';
import { SegmentAttachmentType } from './segments';
import { SUPPORTED_LOCALES } from '@/locales/locales';
import { type LocalizedFiles } from '@/files/files';

@Injectable()
export class SegmentService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentTranslation)
    private readonly translationRepository: Repository<SegmentTranslation>,
    private readonly filesService: FilesService,
  ) {}

  findOneForChapter(id: string, chapterId: string): Promise<Segment> {
    return this.segmentRepository.findOneByOrFail({ id, chapterId });
  }

  async findAllForChapter(chapterId: string): Promise<Segment[]> {
    return await this.segmentRepository.find({
      where: { chapterId },
      order: { order: 'ASC' },
    });
  }

  async create(
    dto: CreateSegmentDto,
    chapterId: string,
    files: LocalizedFiles,
  ): Promise<Segment> {
    const { order, translations, type } = dto;

    const segment = await this.segmentRepository.save(
      this.segmentRepository.create({
        chapterId,
        order,
        type,
        files: [],
        translations: [],
      }),
    );

    if (type === SegmentAttachmentType.TEXT) {
      if (translations !== undefined) {
        segment.translations = await this.translationRepository.save(
          translations.map(({ locale, content }) =>
            this.translationRepository.create({
              segmentId: segment.id,
              localeCode: locale,
              content,
            }),
          ),
        );
      }
    } else {
      await this.saveFiles(files, segment);
    }

    return segment;
  }

  async update(
    dto: UpdateSegmentDto,
    segment: Segment,
    files?: LocalizedFiles,
  ): Promise<Segment> {
    const { order, translations } = dto;

    if (order !== undefined) {
      segment.order = order;
    }

    if (segment.type === SegmentAttachmentType.TEXT) {
      if (translations !== undefined) {
        for (const translation of translations) {
          await this.translationRepository.upsert(
            {
              segmentId: segment.id,
              localeCode: translation.locale,
              content: translation.content,
            },
            ['segmentId', 'localeCode'],
          );
        }

        segment.translations = await this.translationRepository.find({
          where: { segmentId: segment.id },
          order: { localeCode: 'ASC' },
        });
      }
    } else if (files) {
      await this.saveFiles(files, segment);
    }

    return await this.segmentRepository.save(segment);
  }

  async delete(segment: Segment): Promise<void> {
    if (segment.files) {
      for (const file of segment.files) {
        await this.filesService.delete(file.id);
      }
    }

    await this.segmentRepository.delete({
      id: segment.id,
      chapterId: segment.chapterId,
    });
  }

  private async saveFiles(
    files: LocalizedFiles,
    segment: Segment,
  ): Promise<void> {
    for (const locale of SUPPORTED_LOCALES) {
      const fileKey = `file_${locale}`;

      if (files[fileKey]) {
        const existingFile = segment.files?.find(
          (f) => f.localeCode === locale,
        );
        if (existingFile) {
          await this.filesService.delete(existingFile.id);
        }

        const [file] = files[fileKey];

        await this.filesService.upload({
          originalname: file.originalname,
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
          segmentId: segment.id,
          locale,
        });
      }
    }

    segment.files = await this.filesService.findBySegmentId(segment.id);
  }
}
