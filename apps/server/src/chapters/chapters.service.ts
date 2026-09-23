import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(ChapterTranslation)
    private readonly translationRepository: Repository<ChapterTranslation>,
  ) {}

  findOne(id: string): Promise<Chapter> {
    return this.chapterRepository.findOneByOrFail({ id });
  }

  findOneForCourse(id: string, courseId: string): Promise<Chapter> {
    return this.chapterRepository.findOneByOrFail({ id, courseId });
  }

  findAllForCourse(courseId: string): Promise<Chapter[]> {
    return this.chapterRepository.find({
      where: { courseId },
      order: { order: 'ASC' },
    });
  }

  async create(dto: CreateChapterDto, courseId: string): Promise<Chapter> {
    const { translations, order } = dto;

    const chapter = this.chapterRepository.create({ order, courseId });
    await this.chapterRepository.save(chapter);

    chapter.translations = await this.translationRepository.save(
      translations.map(({ locale, title }) =>
        this.translationRepository.create({
          chapterId: chapter.id,
          localeCode: locale,
          title,
        }),
      ),
    );

    return chapter;
  }

  async update(dto: UpdateChapterDto, chapter: Chapter): Promise<Chapter> {
    if (dto.order !== undefined) {
      chapter.order = dto.order;
    }

    if (dto.translations !== undefined) {
      for (const translation of dto.translations) {
        await this.translationRepository.upsert(
          {
            chapterId: chapter.id,
            localeCode: translation.locale,
            title: translation.title,
          },
          ['chapterId', 'localeCode'],
        );
      }

      chapter.translations = await this.translationRepository.find({
        where: { chapterId: chapter.id },
        order: { localeCode: 'ASC' },
      });
    }

    return await this.chapterRepository.save(chapter);
  }

  async delete(id: string): Promise<void> {
    await this.chapterRepository.delete({ id });
  }
}
