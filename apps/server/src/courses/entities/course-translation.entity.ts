import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseTranslation } from '@/common/entities/base-translation.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Course } from './course.entity';

@Entity('course_translations')
export class CourseTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Seed((faker) => faker.book.title())
  @Column()
  title: string;

  @Seed((faker) => faker.lorem.paragraphs({ min: 1, max: 3 }))
  @Column({ type: 'text', nullable: true })
  content: string | null;
}
