import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@/users/users.module';
import { MailerModule } from '@/mailer/mailer.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { UserActivation } from './entities/user-activation.entity';
import { UserActivationsService } from './user-activations.service';
import { UserActivationsController } from './user-activations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserActivation]),
    UsersModule,
    MailerModule,
    AuditLogModule,
  ],
  controllers: [UserActivationsController],
  providers: [UserActivationsService],
})
export class UserActivationsModule {}
