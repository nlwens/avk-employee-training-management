import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Segment } from '@/segments/entities/segment.entity';
import { Locale } from '@/locales/entities/locale.entity';
import type { LocaleCode } from '@/locales/locales';
import { StorageProvider } from '../enums/storage-provider.enum';
import { MimeType } from '../files';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint')
  size: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', enum: MimeType, name: 'mimetype' })
  mimetype: MimeType;

  @Column({ type: 'varchar', enum: StorageProvider })
  provider: StorageProvider;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('uuid', { name: 'segment_id', nullable: true })
  segmentId: string;

  @ManyToOne(() => Segment, (s) => s.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment | null;

  @Column('character', { length: 2, name: 'locale', nullable: true })
  localeCode: LocaleCode | null;

  @ManyToOne(() => Locale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locale', referencedColumnName: 'code' })
  locale: Locale | null;
}
