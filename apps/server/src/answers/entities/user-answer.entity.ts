import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Question } from '@/questions/entities/question.entity';
import { Answer } from './answer.entity';

@Entity('user_answers')
export class UserAnswer {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn('uuid', { name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @PrimaryColumn('uuid', { name: 'answer_id' })
  answerId: string;

  @ManyToOne(() => Answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
