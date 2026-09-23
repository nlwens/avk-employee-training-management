import { Global, Module } from '@nestjs/common';
import { IsInDatabaseConstraint } from './is-in-database.validator';

@Global()
@Module({
  providers: [IsInDatabaseConstraint],
  exports: [IsInDatabaseConstraint],
})
export class ValidatorsModule {}
