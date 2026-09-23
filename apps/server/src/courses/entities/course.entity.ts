import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';
import { Group } from '@/groups/entities/group.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { Question } from '@/questions/entities/question.entity';
import { CourseTranslation } from './course-translation.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Seed(() => true)
  @Column('boolean', { default: false })
  published: boolean;

  @Seed((faker) => faker.number.int({ min: 0, max: 100 }))
  @Column({ default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CourseTranslation, (t) => t.course, { eager: true })
  translations: CourseTranslation[];

  @ManyToMany(() => Group, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'courses_groups',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: Group[];

  @OneToMany(() => Chapter, (c) => c.course)
  chapters: Chapter[];

  @OneToMany(() => Question, (q) => q.course)
  questions: Question[];

  @VirtualColumn({
    query: (alias) =>
      `select count(*) from chapters where course_id = ${alias}.id`,
  })
  chaptersCount: number = 0;

  @VirtualColumn({
    query: (alias) =>
      `select count(*) from questions where course_id = ${alias}.id`,
  })
  questionsCount: number = 0;

  // Number of chapters completed by the requesting user in this course.
  // Not persisted; it is populated at query time by CoursesService.
  completedChaptersCount: number = 0;

  // Number of questions answered correctly by the requesting user in this
  // course. Not persisted; it is populated at query time by CoursesService.
  correctAnswersCount: number = 0;
}
