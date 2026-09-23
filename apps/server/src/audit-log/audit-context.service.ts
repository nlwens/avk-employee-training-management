import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditActor {
  id: string;
}

interface AuditContext {
  actor: AuditActor | null;
  ip: string | null;
  route: string | null;
  operation: string | null;
}

/**
 * Propagates the audit context (actor, client IP, and action label) through
 * the async call chain of a single HTTP request without passing them as
 * explicit arguments.
 *
 * `AuditSubscriber` is a TypeORM singleton that lives outside NestJS's request
 * scope. It fires on every database event but has no access to the HTTP request
 * and therefore cannot know the context or who triggered the change. The same
 * applies to `AuditLogService.log()` called from deep inside a service method.
 *
 * Node.js `AsyncLocalStorage` binds a value to the current *async context*, a
 * logical execution unit that propagates automatically across `Promise` chains,
 * event emitters, and callbacks that originate from the same root call. Every
 * piece of code that runs as part of handling a given request shares the same
 * store, regardless of call depth.
 *
 * 1. `AuditInterceptor` wraps every request by calling `run()` with the actor
 *    from the JWT guard, the client IP, and the operation set by `@AuditLog()`.
 * 2. `AuditSubscriber` calls `getOperation()` at the start of each TypeORM
 *    event. A `null` return means the endpoint is not decorated, so the event
 *    is skipped. This naturally excludes bootstrap and other server operations.
 * 3. `AuditLogService.log()` checks `getOperation()` as a gate before writing,
 *    then reads user and operation context to populate the log entry.
 *
 * `getStore()` returns `undefined` when called outside an active `run()` scope.
 * All getters return `null` in that case.
 */
@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  run<T>(
    actor: AuditActor | null,
    ip: string | null,
    route: string | null,
    operation: string | null,
    fn: () => T,
  ): T {
    return this.storage.run({ actor, ip, route, operation }, fn);
  }

  getOperation(): string | null {
    return this.storage.getStore()?.operation ?? null;
  }

  getActor(): AuditActor | null {
    return this.storage.getStore()?.actor ?? null;
  }

  getIp(): string | null {
    return this.storage.getStore()?.ip ?? null;
  }

  getRoute(): string | null {
    return this.storage.getStore()?.route ?? null;
  }
}
