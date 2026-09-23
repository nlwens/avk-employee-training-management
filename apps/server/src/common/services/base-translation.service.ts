import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseTranslation } from '../entities/base-translation.entity';
import { DEFAULT_LOCALE, LocaleCode } from '../../locales/locales';

export abstract class BaseTranslationService<T extends BaseTranslation> {
  protected constructor(protected readonly repository: Repository<T>) {}

  protected async findTranslation(
    where: FindOptionsWhere<T>,
    localeCode: LocaleCode,
  ): Promise<T | null> {
    const result = await this.repository.findOne({
      where: { ...where, localeCode },
    });

    if (!result && localeCode !== DEFAULT_LOCALE) {
      return this.repository.findOne({
        where: { ...where, localeCode: DEFAULT_LOCALE },
      });
    }

    return result;
  }

  protected async findTranslations(
    where: FindOptionsWhere<T>,
    localeCode: LocaleCode,
  ): Promise<T[]> {
    const results = await this.repository.find({
      where: { ...where, localeCode },
    });

    if (!results.length && localeCode !== DEFAULT_LOCALE) {
      return this.repository.find({
        where: { ...where, localeCode: DEFAULT_LOCALE },
      });
    }

    return results;
  }
}
