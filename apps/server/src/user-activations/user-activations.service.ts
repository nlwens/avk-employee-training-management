import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditAction } from '@/audit-log/enums/audit-action.enum';
import { MailerService } from '@/mailer/mailer.service';
import { UserActivation } from './entities/user-activation.entity';

const ACTIVATION_EXPIRY_HOURS = 24;

@Injectable()
export class UserActivationsService {
  constructor(
    @InjectRepository(UserActivation)
    private readonly activationsRepository: Repository<UserActivation>,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @OnEvent('user.created')
  async handleUserCreated(user: User): Promise<void> {
    const activation = await this.create(user);
    await this.sendWelcomeEmail(user, activation.code);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredActivations(): Promise<void> {
    const expired = await this.activationsRepository.find({
      where: { expiresAt: LessThan(new Date()) },
      select: ['userId'],
    });

    if (expired.length === 0) {
      return;
    }

    for (const { userId } of expired) {
      await this.usersService.delete(userId);

      // The audit log service works only in the context of HTTP requests.
      // However, we want to log this automatic deletion for auditing purposes.
      await this.auditLogService.log({
        operation: 'user-activations.expire',
        action: AuditAction.DELETED,
        entityType: 'User',
        entityKeys: { id: userId },
      });

      // The user activation entry is automatically deleted with the user.
    }
  }

  findOne(code: string): Promise<UserActivation> {
    return this.activationsRepository.findOneByOrFail({ code });
  }

  async activate(activation: UserActivation, password: string): Promise<void> {
    await this.usersService.update(activation.userId, { password });
    await this.activationsRepository.remove(activation);
  }

  private async create(user: User): Promise<UserActivation> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ACTIVATION_EXPIRY_HOURS);

    return this.activationsRepository.save(
      this.activationsRepository.create({
        code: randomBytes(72).toString('base64url').substring(0, 72),
        userId: user.id,
        expiresAt,
      }),
    );
  }

  private async sendWelcomeEmail(user: User, code: string): Promise<void> {
    const clientUrl = this.configService.get<string>('APP_URL');

    await this.mailerService.send({
      to: user.email,
      template: 'welcome',
      locale: user.localeCode,
      context: {
        activationLink: `${clientUrl}/user/activate/${code}`,
        name: user.name,
        expiryHours: ACTIVATION_EXPIRY_HOURS,
      },
    });
  }
}
