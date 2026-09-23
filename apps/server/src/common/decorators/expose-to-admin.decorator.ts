import { Transform } from 'class-transformer';

export const ADMIN_GROUP = 'admin';

/**
 * Marks a DTO property as visible to administrators only.
 *
 * Works in conjunction with `@Serialize()`. The property is omitted entirely
 * from non-admin responses.
 *
 * ```ts
 * export class QuestionDto {
 *   @ExposeToAdmin()
 *   correctAnswerId: string | null;
 * }
 * ```
 */
export function ExposeToAdmin(): PropertyDecorator {
  return Transform(({ value, options }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    options.groups?.includes(ADMIN_GROUP) ? value : undefined,
  );
}
