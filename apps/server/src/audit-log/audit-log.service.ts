import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditActor, AuditContextService } from './audit-context.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';

export interface LogParams {
  actor?: AuditActor | null;
  operation?: string;
  action: AuditAction;
  entityType?: string;
  entityKeys?: Record<string, unknown>;
  diff?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly auditContext: AuditContextService,
  ) {}

  async log(params: LogParams): Promise<void> {
    const operation = params.operation ?? this.auditContext.getOperation();

    if (!operation) {
      return;
    }

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actorId: params.actor?.id ?? this.auditContext.getActor()?.id,
        ipAddress: this.auditContext.getIp(),
        route: this.auditContext.getRoute(),
        operation: operation,
        action: params.action,
        entityType: params.entityType ?? null,
        entityKeys: params.entityKeys ?? null,
        after: params.diff?.after ?? null,
        before: params.diff?.before ?? null,
        metadata: params.metadata ?? null,
      }),
    );
  }
}
