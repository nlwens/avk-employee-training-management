import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Seed } from '@/common/decorators/seed.decorator';
import { User } from '@/users/entities/user.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Seed((faker) => `${faker.word.adjective()} ${faker.word.noun()}`)
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => User, (user) => user.groups)
  users: User[];
}
