import { Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  I18nModule as NestI18nModule,
} from 'nestjs-i18n';
import { join } from 'path';
import { DEFAULT_LOCALE } from '@/locales/locales';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: DEFAULT_LOCALE,
      loaderOptions: {
        path: join(__dirname, 'locales'),
        watch: false,
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
})
export class I18nModule {}
