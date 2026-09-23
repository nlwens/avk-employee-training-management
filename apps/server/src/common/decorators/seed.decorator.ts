import type { faker as Faker } from '@faker-js/faker';

export const SEED_METADATA_KEY = Symbol('seed:fn');

export type SeedFn<T = unknown> = (
  faker: typeof Faker,
  current: Record<string, unknown>,
) => T | Promise<T>;

/**
 * Entity property decorator that attaches a faker factory function to a column.
 *
 * Apply it to any column whose value should be auto-generated:
 *
 * ```ts
 * @Seed((faker) => faker.person.firstName())
 * @Column()
 * name: string;
 * ```
 *
 * If you use this decorator for the first time in an entity, make sure to run
 * seeding for that entity in the `SeederModule`. Simpler entities with no
 * dependencies can use `createMany` from the `SeedFactory` while more complex
 * ones should create their own seeder in the specific module. Make sure to then
 * register such a seeder as a provider in the `SeederModule` where you may use
 * it, too.
 */
export function Seed<T>(fn: SeedFn<T>): PropertyDecorator {
  return Reflect.metadata(SEED_METADATA_KEY, fn);
}
