import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditContextService } from './audit-context.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditSubscriber } from './audit.subscriber';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditContextService,
    AuditLogService,
    AuditSubscriber,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditContextService, AuditLogService],
})
export class AuditLogModule {}
