import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { LocaleCode } from '../locales';

@Entity('locales')
export class Locale {
  @PrimaryColumn('character', { length: 2, nullable: false })
  code: LocaleCode;

  @Column()
  name: string;

  @Column({ name: 'name_localized', nullable: true, type: 'varchar' })
  nameLocalized: string | null;
}
