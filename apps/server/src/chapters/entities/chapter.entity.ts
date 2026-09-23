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
import { Course } from '@/courses/entities/course.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Segment } from '@/segments/entities/segment.entity';
import { ChapterTranslation } from './chapter-translation.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Seed((faker) => faker.number.int({ min: 1, max: 10 }))
  @Column({ type: 'int', name: 'order' })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ChapterTranslation, (t) => t.chapter, { eager: true })
  translations: ChapterTranslation[];

  @OneToMany(() => Segment, (s) => s.chapter)
  segments: Segment[];
}
