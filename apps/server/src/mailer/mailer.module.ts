import { join } from 'path';
import { I18nService } from 'nestjs-i18n';
import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DEFAULT_LOCALE, LocaleCode } from '@/locales/locales';
import { MjmlHandlebarsAdapter } from './adapters/mjml-handlebars.adapter';
import { MailerService } from './mailer.service';

// The t helper is a closure over I18nService that reads the locale from the
// Handlebars root context, which MailerService always injects.
function createTranslationHelper(i18n: I18nService) {
  return function t(
    key: string,
    options: {
      data?: { root?: { locale?: string } };
      hash?: Record<string, unknown>;
    },
  ): string {
    const lang = (options.data?.root?.locale ?? DEFAULT_LOCALE) as LocaleCode;
    const args = options.hash ?? {};
    return String(i18n.t(key, { lang, args }));
  };
}

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT', 587),
          secure: config.get<string>('MAIL_SECURE') === 'true',

          // Omit auth entirely for local SMTP servers that do not require it
          // (e.g., MailDev). nodemailer skips AUTH when auth is undefined.
          auth: config.get<string>('MAIL_USER')
            ? {
                user: config.get<string>('MAIL_USER'),
                pass: config.get<string>('MAIL_PASSWORD'),
              }
            : undefined,
        },

        defaults: {
          from: {
            name: config.get<string>('MAIL_FROM_NAME', 'AVK'),
            address: config.get<string>(
              'MAIL_FROM_ADDRESS',
              'noreply@avknederland.nl',
            ),
          },
        },

        template: {
          dir: join(__dirname, 'templates'),
          adapter: new MjmlHandlebarsAdapter({
            t: createTranslationHelper(i18n),
          }),
        },
      }),
      inject: [ConfigService, I18nService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
