import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Seed } from '@/common/decorators/seed.decorator';
import { randomBytes } from 'crypto';

@Entity({ name: 'user_activations' })
export class UserActivation {
  @Seed(() => randomBytes(72).toString('base64url').substring(0, 72))
  @PrimaryColumn('character', { length: 72 })
  code: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Seed((faker) => faker.date.soon())
  @Column({ name: 'expires_at' })
  expiresAt: Date;
}
