import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';

@Entity('completed_chapters')
export class CompletedChapter {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn('uuid', { name: 'chapter_id' })
  chapterId: string;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
