import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Column, Entity, PrimaryColumn, Repository } from 'typeorm';
import { BaseTranslation } from '../entities/base-translation.entity';
import { BaseTranslationService } from './base-translation.service';
import {
  ENGLISH_LOCALE,
  DUTCH_LOCALE,
  DEFAULT_LOCALE,
  LocaleCode,
} from '@/locales/locales';

@Entity('stub_translations')
class StubTranslation extends BaseTranslation {
  @PrimaryColumn({ type: 'uuid', name: 'stub_id' })
  stubId: string;

  @Column()
  text: string;
}

class StubTranslationService extends BaseTranslationService<StubTranslation> {
  constructor(repository: Repository<StubTranslation>) {
    super(repository);
  }

  getOne(stubId: string, localeCode: LocaleCode) {
    return this.findTranslation({ stubId }, localeCode);
  }

  getAll(stubId: string, localeCode: LocaleCode) {
    return this.findTranslations({ stubId }, localeCode);
  }
}

const STUB_ID = '00000000-0000-0000-0000-000000000001';

function makeStubTranslation(
  localeCode: LocaleCode,
  overrides: Partial<StubTranslation> = {},
): StubTranslation {
  return Object.assign(new StubTranslation(), {
    stubId: STUB_ID,
    localeCode,
    text: `Text in ${localeCode}`,
    ...overrides,
  });
}

const enStubTranslation = makeStubTranslation(ENGLISH_LOCALE);
const nlStubTranslation = makeStubTranslation(DUTCH_LOCALE);

describe('BaseTranslationService', () => {
  let service: StubTranslationService;
  let repo: jest.Mocked<Pick<Repository<StubTranslation>, 'findOne' | 'find'>>;

  beforeEach(() => {
    repo = { findOne: jest.fn(), find: jest.fn() };
    service = new StubTranslationService(
      repo as unknown as Repository<StubTranslation>,
    );
  });

  describe('findTranslation', () => {
    it('returns the translation for the requested locale', async () => {
      repo.findOne.mockResolvedValueOnce(enStubTranslation);

      const result = await service.getOne(STUB_ID, ENGLISH_LOCALE);

      expect(result).toBe(enStubTranslation);
      expect(result!.localeCode).toBe(ENGLISH_LOCALE);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { stubId: STUB_ID, localeCode: ENGLISH_LOCALE },
      });
    });

    it('falls back to the default locale when the requested locale is not found', async () => {
      repo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(nlStubTranslation);

      const result = await service.getOne(STUB_ID, ENGLISH_LOCALE);

      expect(result).toBe(nlStubTranslation);
      expect(result!.localeCode).toBe(DEFAULT_LOCALE);
      expect(repo.findOne).toHaveBeenCalledTimes(2);
      expect(repo.findOne).toHaveBeenNthCalledWith(2, {
        where: { stubId: STUB_ID, localeCode: DEFAULT_LOCALE },
      });
    });
  });

  describe('findTranslations', () => {
    it('returns translations for the requested locale', async () => {
      repo.find.mockResolvedValueOnce([enStubTranslation]);

      const result = await service.getAll(STUB_ID, ENGLISH_LOCALE);

      expect(result).toEqual([enStubTranslation]);
      expect(result[0]?.localeCode).toBe(ENGLISH_LOCALE);
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { stubId: STUB_ID, localeCode: ENGLISH_LOCALE },
      });
    });

    it('falls back to the default locale when no translations exist for the requested locale', async () => {
      repo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([nlStubTranslation]);

      const result = await service.getAll(STUB_ID, ENGLISH_LOCALE);

      expect(result).toEqual([nlStubTranslation]);
      expect(result[0]?.localeCode).toBe(DEFAULT_LOCALE);
      expect(repo.find).toHaveBeenCalledTimes(2);
      expect(repo.find).toHaveBeenNthCalledWith(2, {
        where: { stubId: STUB_ID, localeCode: DEFAULT_LOCALE },
      });
    });
  });
});
