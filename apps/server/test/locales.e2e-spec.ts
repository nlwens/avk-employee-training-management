import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';
import { LocalesModule } from '@/locales/locales.module';
import { createTestServer } from './utils';

describe('LocalesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestServer([LocalesModule]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /locales', () => {
    it('returns 200 with an array of all seeded locales', async () => {
      const response = await request(app.getHttpServer())
        .get('/locales')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(SUPPORTED_LOCALES.length);
      expect(
        response.body
          .map((locale: { code: LocaleCode }) => locale.code)
          .toSorted(),
      ).toEqual(SUPPORTED_LOCALES.toSorted());
    });
  });
});
