import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from '@/questions/entities/question.entity';
import { AnswerTranslation } from './answer-translation.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, (q) => q.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @OneToMany(() => AnswerTranslation, (t) => t.answer, { eager: true })
  translations: AnswerTranslation[];
}
