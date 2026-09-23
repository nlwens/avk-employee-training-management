import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseTranslation } from '@/common/entities/base-translation.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Chapter } from './chapter.entity';

@Entity('chapter_translations')
export class ChapterTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'chapter_id' })
  chapterId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @Seed((faker) => faker.commerce.productName())
  @Column({ type: 'varchar' })
  title: string;
}
