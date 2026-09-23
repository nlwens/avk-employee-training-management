import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '@/courses/entities/course.entity';
import { Answer } from '@/answers/entities/answer.entity';
import { QuestionTranslation } from './question-translation.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  order: number;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column('uuid', { name: 'correct_answer_id', nullable: true })
  correctAnswerId: string | null;

  @OneToOne(() => Answer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'correct_answer_id' })
  correctAnswer: Answer | null;

  @OneToMany(() => QuestionTranslation, (t) => t.question, { eager: true })
  translations: QuestionTranslation[];

  @OneToMany(() => Answer, (a) => a.question)
  answers: Answer[];
}
