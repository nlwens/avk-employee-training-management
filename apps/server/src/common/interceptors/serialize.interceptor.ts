import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ADMIN_GROUP } from '../decorators/expose-to-admin.decorator';

interface ClassConstructor {
  new (...args: any[]): object;
}

/**
 * Controller/route decorator that transforms outgoing responses through a DTO.
 *
 * Apply it to a whole controller to serialize every route or to a single route
 * handler to target only that endpoint:
 *
 * ```ts
 * @Serialize(UserDto) // for the entire controller
 * @Controller('users')
 * export class UsersController { ... }
 *
 * @Get(':id')
 * @Serialize(UserDto) // just for this route
 * findOne(@Param('id') id: string) { ... }
 * ```
 *
 * Why use it: service methods typically return ORM entities which may expose
 * internal fields (e.g., hashed passwords, internal flags). Decorating
 * endpoints with `@Serialize(SomeDto)` ensures that fields marked with
 * `@Exclude()` are stripped from the response.
 *
 * Nested objects are transformed recursively when DTO properties carry a
 * `@Type()` decorator, which allows class-transformer to instantiate the
 * correct nested DTO class and apply its decorators.
 *
 * Fields decorated with `@ExposeToAdmin()` are omitted from responses for
 * non-admin users. The admin status is read from `request.user` that is
 * populated by the JWT guard.
 */
export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializerInterceptor(dto));
}

/**
 * Underlying interceptor used by `@Serialize`.
 *
 * Converts handler output by:
 *
 * - Running it through `instanceToPlain` (strips class metadata / private fields)
 * - Then through `plainToInstance(dto, ...)` (remaps into the target DTO shape,
 *   recursing into nested DTOs that carry `@Type()`)
 * - Passing `groups: ['admin']` to `plainToInstance` when the authenticated
 *   user is an admin, which enables `@ExposeToAdmin()` fields for that request
 */
@Injectable()
export class SerializerInterceptor implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { admin?: boolean } }>();

    const groups = request.user?.admin ? [ADMIN_GROUP] : [];

    return next
      .handle()
      .pipe(
        map((data) =>
          plainToInstance(this.dto, instanceToPlain(data), { groups }),
        ),
      );
  }
}
