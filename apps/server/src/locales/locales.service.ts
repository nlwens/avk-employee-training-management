import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locale } from './entities/locale.entity';
import { ENGLISH_LOCALE, DUTCH_LOCALE, LocaleCode } from './locales';

@Injectable()
export class LocalesService {
  constructor(
    @InjectRepository(Locale)
    private readonly localeRepository: Repository<Locale>,
  ) {}

  findAll(): Promise<Locale[]> {
    return this.localeRepository.find();
  }

  findOne(code: LocaleCode): Promise<Locale> {
    return this.localeRepository.findOneByOrFail({ code });
  }

  async initializeLocales(): Promise<void> {
    await this.localeRepository.upsert(
      [
        { code: ENGLISH_LOCALE, name: 'English', nameLocalized: 'English' },
        { code: DUTCH_LOCALE, name: 'Dutch', nameLocalized: 'Nederlands' },
      ],
      ['code'],
    );
  }
}
