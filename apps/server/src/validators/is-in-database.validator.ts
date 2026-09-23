import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EntityManager } from 'typeorm';

@ValidatorConstraint({ async: true })
export class IsInDatabaseConstraint implements ValidatorConstraintInterface {
  constructor(private readonly entityManager: EntityManager) {}

  async validate(value: unknown, args: ValidationArguments) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [EntityClass, property = 'id'] = args.constraints;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const repository = this.entityManager.getRepository(EntityClass);

    const row = await repository.findOne({
      where: { [property]: value },
    });

    return !!row;
  }

  defaultMessage() {
    return '$value does not exist';
  }
}

/**
 * Validate that the provided ID corresponds to an existing entity of a type.
 * @author Jose Garcia <https://medium.com/%40jogarcia/nestjs-database-dto-decorator-2ad41c3f5842>
 */
export function IsInDatabase<G>(
  entity: G,
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, property],
      validator: IsInDatabaseConstraint,
    });
  };
}
