import { JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Locale } from '../../locales/entities/locale.entity';
import type { LocaleCode } from '../../locales/locales';

export abstract class BaseTranslation {
  @PrimaryColumn('character', { length: 2, name: 'locale', nullable: false })
  localeCode: LocaleCode;

  @ManyToOne(() => Locale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locale', referencedColumnName: 'code' })
  locale: Locale;
}
