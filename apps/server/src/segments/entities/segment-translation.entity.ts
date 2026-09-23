import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseTranslation } from '../../common/entities/base-translation.entity';
import { Segment } from './segment.entity';
import { Seed } from '../../common/decorators/seed.decorator';

@Entity('segment_translations')
export class SegmentTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'segment_id' })
  segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @Seed((faker) => faker.lorem.paragraphs({ min: 1, max: 3 }))
  @Column({ type: 'text', nullable: true })
  content: string;
}
