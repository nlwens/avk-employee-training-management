import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Seed } from '@/common/decorators/seed.decorator';
import { Group } from '@/groups/entities/group.entity';
import { Locale } from '@/locales/entities/locale.entity';
import { type LocaleCode, DEFAULT_LOCALE } from '@/locales/locales';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Seed((faker) => faker.person.firstName())
  @Column()
  name: string;

  @Seed((faker) => faker.person.lastName())
  @Column()
  surname: string;

  @Seed((faker, { name, surname }) =>
    faker.internet.email({
      firstName: name as string,
      lastName: surname as string,
    }),
  )
  @Column({ unique: true })
  email: string;

  @Seed(() => hash('password', 12))
  @Column()
  password: string;

  @Column({ default: false })
  admin: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'password_changed_at', default: () => 'CURRENT_TIMESTAMP' })
  passwordChangedAt: Date;

  @Column('character', { length: 2, name: 'locale', default: DEFAULT_LOCALE })
  localeCode: LocaleCode;

  @ManyToOne(() => Locale)
  @JoinColumn({ name: 'locale', referencedColumnName: 'code' })
  locale: Locale;

  @ManyToMany(() => Group, (group) => group.users, { eager: true })
  @JoinTable({
    name: 'users_groups',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: Group[];
}
