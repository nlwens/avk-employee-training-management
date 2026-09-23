import { Injectable, Logger } from '@nestjs/common';
import { SUPPORTED_LOCALES } from '../locales/locales';
import { SeedFactory } from '../seeder/seed.factory';
import { Chapter } from '../chapters/entities/chapter.entity';
import { SegmentAttachmentType } from './segments';
import { Segment } from './entities/segment.entity';
import { SegmentTranslation } from './entities/segment-translation.entity';

@Injectable()
export class SegmentsSeeder {
  private readonly logger = new Logger(SegmentsSeeder.name);

  constructor(private readonly factory: SeedFactory) {}

  async seed(chapter: Chapter, count = 3): Promise<Segment[]> {
    this.logger.log(`Seeding ${count} segments for chapter ${chapter.id}...`);

    const segments: Segment[] = [];

    for (let i = 0; i < count; i++) {
      const segment = await this.factory.create(Segment, {
        chapterId: chapter.id,
        order: i + 1,
        type: SegmentAttachmentType.TEXT,
      });

      segments.push(segment);

      segment.translations = await Promise.all(
        SUPPORTED_LOCALES.map((localeCode) =>
          this.factory.create(SegmentTranslation, {
            segmentId: segment.id,
            localeCode,
          }),
        ),
      );
    }

    return segments;
  }
}
