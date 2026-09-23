import { Transform } from 'class-transformer';

/**
 * Transform a query-string value into a boolean.
 *
 * Query parameters always arrive as strings, so `"true"` becomes `true` and any
 * other present value becomes `false`. `null`/`undefined` is preserved, so
 * optional filters can be left out entirely.
 */
export const TransformToBoolean = (): PropertyDecorator =>
  Transform(({ value }) =>
    value == null ? undefined : value === 'true' || value === true,
  );
