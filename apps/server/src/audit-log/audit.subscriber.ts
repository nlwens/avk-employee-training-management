import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityMetadata,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditContextService } from './audit-context.service';
import { AuditLogService, LogParams } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'accessToken']);
const IGNORED_ENTITY_NAMES = new Set([AuditLog.name]);

// Filter out sensitive or internal properties from the entity.
const sanitize = (entity: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(entity).filter(
      ([key]) => !SENSITIVE_KEYS.has(key) && !key.startsWith('__'),
    ),
  );

interface BaseOpEvent {
  entity: ObjectLiteral;
  metadata: EntityMetadata;
}

@Injectable()
@EventSubscriber()
export class AuditSubscriber
  implements EntitySubscriberInterface, OnModuleInit
{
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditContext: AuditContextService,
    private readonly auditLogService: AuditLogService,
  ) {}

  onModuleInit(): void {
    this.dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<object>): Promise<void> {
    return this.createLogEntry(AuditAction.CREATED, event, () => ({
      diff: { after: sanitize(event.entity) },
    }));
  }

  afterUpdate(event: UpdateEvent<object>): Promise<void> {
    return this.createLogEntry(
      AuditAction.UPDATED,
      event as BaseOpEvent,
      () => ({
        diff: {
          before: event.databaseEntity ? sanitize(event.databaseEntity) : null,
          after: event.entity ? sanitize(event.entity) : null,
        },
      }),
    );
  }

  beforeRemove(event: RemoveEvent<object>): Promise<void> {
    return this.createLogEntry(
      AuditAction.DELETED,
      event as BaseOpEvent,
      () => ({
        diff: { before: event.entity ? sanitize(event.entity) : null },
      }),
    );
  }

  private async createLogEntry(
    action: AuditAction,
    event: BaseOpEvent,
    makeLogParams: () => Partial<LogParams>,
  ): Promise<void> {
    // Either the entity data is missing, or we are not interested in logging it.
    if (!event.entity || IGNORED_ENTITY_NAMES.has(event.metadata.name)) {
      return;
    }

    try {
      await this.auditLogService.log({
        ...makeLogParams(),
        ...this.buildLogContext(action, event),
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${action}`, error);
    }
  }

  private buildLogContext(action: AuditAction, event: BaseOpEvent): LogParams {
    return {
      action,
      actor: this.auditContext.getActor(),
      entityType: event.metadata.name,
      entityKeys: event.metadata.getEntityIdMap(event.entity),
    };
  }
}
