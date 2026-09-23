import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { SUPPORTED_LOCALES } from '@/locales/locales';
import { SeedFactory } from '@/seeder/seed.factory';
import { Course } from '@/courses/entities/course.entity';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import { Chapter } from './entities/chapter.entity';
import { ChapterTranslation } from './entities/chapter-translation.entity';

@Injectable()
export class ChaptersSeeder {
  private readonly logger = new Logger(ChaptersSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    private readonly segmentsSeeder: SegmentsSeeder,
  ) {}

  async seed(course: Course, count = 3): Promise<Chapter[]> {
    this.logger.log(`Seeding ${count} chapters for course ${course.id}...`);

    const chapters: Chapter[] = [];

    for (let i = 0; i < count; i++) {
      const chapter = await this.factory.create(Chapter, {
        courseId: course.id,
        order: i + 1,
      });

      chapters.push(chapter);

      chapter.translations = await Promise.all(
        SUPPORTED_LOCALES.map((localeCode) =>
          this.factory.create(ChapterTranslation, {
            chapterId: chapter.id,
            localeCode,
          }),
        ),
      );

      chapter.segments = await this.segmentsSeeder.seed(
        chapter,
        faker.number.int({ min: 1, max: 3 }),
      );
    }

    return chapters;
  }
}
