import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig } from './orm.config';

@Global()
@Module({
  imports: [TypeOrmModule.forRootAsync(ormconfig)],
})
export class DatabaseModule {}
