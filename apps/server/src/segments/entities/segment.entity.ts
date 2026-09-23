import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SegmentAttachmentType } from '../segments';
import { Seed } from '@/common/decorators/seed.decorator';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { File } from '@/files/entities/file.entity';
import { SegmentTranslation } from './segment-translation.entity';

@Entity('segments')
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'chapter_id' })
  chapterId: string;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Seed(() => 'text')
  @Column({ type: 'varchar', enum: SegmentAttachmentType, name: 'type' })
  type: SegmentAttachmentType;

  @Seed((faker) => faker.number.int({ min: 1, max: 5 }))
  @Column({ type: 'int', name: 'order' })
  order: number;

  @OneToMany(() => SegmentTranslation, (t) => t.segment, { eager: true })
  translations: SegmentTranslation[];

  @OneToMany(() => File, (f) => f.segment, { eager: true })
  files: File[];
}
