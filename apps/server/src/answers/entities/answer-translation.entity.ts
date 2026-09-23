import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseTranslation } from '@/common/entities/base-translation.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { Answer } from './answer.entity';

@Entity('answer_translations')
export class AnswerTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'answer_id' })
  answerId: string;

  @ManyToOne(() => Answer, (a) => a.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Seed((faker) => faker.lorem.words({ min: 2, max: 5 }))
  @Column({ type: 'varchar' })
  text: string;
}
