import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { SendMailOptions } from './mailer.types';

const INLINE_ATTACHMENTS = [
  {
    filename: 'logo-white.png',
    path: join(__dirname, 'assets', 'logo-white.png'),
    cid: 'avk-logo-white',
  },
];

@Injectable()
export class MailerService {
  constructor(
    private readonly mailer: NestMailerService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async send(options: SendMailOptions): Promise<void> {
    const appName = this.config.get<string>('APP_NAME');

    // Resolve the subject from the template's i18n key when the caller does not
    // provide one explicitly, for instance, "mail.welcome.subject".
    const subject =
      options.subject ??
      this.i18n.t(`mail.${options.template}.subject`, {
        lang: options.locale,
        args: { appName },
      });

    await this.mailer.sendMail({
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject,
      template: options.template,
      attachments: INLINE_ATTACHMENTS,

      context: {
        // Base variables available in every template.
        appName,
        appUrl: this.config.get<string>('APP_URL'),
        year: new Date().getFullYear(),
        locale: options.locale,

        ...options.context,
      },
    });
  }
}
