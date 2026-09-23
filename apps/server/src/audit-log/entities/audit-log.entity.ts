import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '@/audit-log/enums/audit-action.enum';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  route: string | null;

  @Column({ type: 'varchar' })
  operation: string;

  @Column({ type: 'varchar', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_keys', type: 'simple-json', nullable: true })
  entityKeys: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  before: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  after: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
