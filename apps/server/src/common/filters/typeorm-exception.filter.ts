import { Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

@Catch(EntityNotFoundError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch() {
    throw new NotFoundException();
  }
}
