import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseTranslation } from '@/common/entities/base-translation.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Question } from './question.entity';

@Entity('question_translations')
export class QuestionTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, (q) => q.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Seed((faker) => faker.lorem.sentence())
  @Column({ type: 'varchar', name: 'question' })
  text: string;

  @Seed((faker) => faker.lorem.sentence())
  @Column({ type: 'varchar', nullable: true })
  explanation: string | null;
}
