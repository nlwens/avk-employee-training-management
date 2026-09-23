import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { faker } from '@faker-js/faker';
import {
  SEED_METADATA_KEY,
  type SeedFn,
} from '@/common/decorators/seed.decorator';

type EntityClass<T> = EntityTarget<T> & (new () => T);

@Injectable()
export class SeedFactory {
  private readonly logger = new Logger(SeedFactory.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create and save a new instance of an entity.
   * @param EntityClass The class of the entity to be created.
   * @param overrides Optional partial object to override the auto-generated property values.
   * @return An instance of a newly created entity of the specified type.
   */
  async create<T extends ObjectLiteral>(
    EntityClass: EntityClass<T>,
    overrides: Partial<T> = {},
  ): Promise<T> {
    const { columns } = this.dataSource.getMetadata(EntityClass);
    const data: Record<string, unknown> = {};

    for (const col of columns) {
      const fn = Reflect.getMetadata(
        SEED_METADATA_KEY,
        EntityClass.prototype as object,
        col.propertyName,
      ) as SeedFn | undefined;

      if (fn) {
        data[col.propertyName] = await fn(faker, data);
      }
    }

    const repo = this.dataSource.getRepository<T>(EntityClass);
    return repo.save(repo.create({ ...data, ...overrides } as T));
  }

  /**
   * Create multiple entities of the specified class.
   * @param EntityClass The class of the entity to be created.
   * @param count The number of entities to create.
   * @param overrides Optional property overrides for the created entities.
   * @return A promise that resolves to an array of created entities.
   */
  createMany<T extends ObjectLiteral>(
    EntityClass: EntityClass<T>,
    count: number,
    overrides: Partial<T> = {},
  ): Promise<T[]> {
    this.logger.log(`Seeding ${EntityClass.name} (${count})...`);

    return Promise.all(
      Array.from({ length: count }, () => this.create(EntityClass, overrides)),
    );
  }
}
