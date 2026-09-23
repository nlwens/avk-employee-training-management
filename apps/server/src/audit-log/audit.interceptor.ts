import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuditActor, AuditContextService } from './audit-context.service';
import { AUDIT_LOG_KEY } from './decorators/audit-log.decorator';

// Maps HTTP methods to the verb appended when @AuditLog ends with a dot.
const METHOD_VERBS: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditContext: AuditContextService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      ip?: string;
      method: string;
      route?: { path: string };
      url: string;
    }>();

    // Read the operation label set by @AuditLog. Handler-level takes precedence
    // over class-level, so individual routes can override the controller.
    let operation = this.reflector.getAllAndOverride<string | undefined>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // We do not want to proceed with auditing the endpoint if it is not marked
    // as such. Likewise, if the operation ends with a dot and the resource is
    // only being read (GET), ignore it.
    if (!operation || (operation.endsWith('.') && request.method === 'GET')) {
      return new Observable((observer) => {
        next.handle().subscribe(observer);
      });
    }

    // Resolve trailing-dot shorthand: @AuditLog('users.') on a POST becomes
    // 'users.create', on a DELETE it becomes 'users.delete', etc.
    if (operation.endsWith('.')) {
      const verb =
        METHOD_VERBS[request.method.toUpperCase()] ??
        request.method.toLowerCase();
      operation = `${operation}${verb}`;
    }

    // Authenticated user set by JwtAuthGuard, null on public routes.
    const actor: AuditActor | null = request.user
      ? { id: request.user.id }
      : null;

    const ip: string | null = request.ip ?? null;

    // Use the route pattern (/users/:id) rather than the resolved URL so that
    // entries for the same endpoint can be grouped when querying audit logs.
    const route = `${request.method} ${request.route?.path ?? request.url}`;

    return new Observable((observer) => {
      this.auditContext.run(actor, ip, route, operation, () => {
        next.handle().subscribe(observer);
      });
    });
  }
}
