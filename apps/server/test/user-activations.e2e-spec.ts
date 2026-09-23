import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { UserActivationsModule } from '@/user-activations/user-activations.module';
import { UserActivation } from '@/user-activations/entities/user-activation.entity';
import { AuthModule } from '@/auth/auth.module';
import { User } from '@/users/entities/user.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { createTestServer, obtainAuthToken } from './utils';

const NEW_PASSWORD = 'SuperSecurePassword123@';

describe('UserActivationsController (e2e)', () => {
  let app: INestApplication<App>;

  let user: User;
  let activation: UserActivation;

  beforeAll(async () => {
    app = await createTestServer(
      [UserActivationsModule, AuthModule],
      undefined,
      [SeedFactory],
    );

    user = await app.get(SeedFactory).create(User);
  });

  beforeEach(async () => {
    // As the user activation gets deleted after activation, we need to recreate
    // it for each test separately.
    activation = await app.get(SeedFactory).create(UserActivation, { user });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /user-activations/:code', () => {
    it('returns 200 with code and expiresAt for a valid activation', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/user-activations/${activation.code}`)
        .expect(200);

      expect(body).toMatchObject({
        expiresAt: activation.expiresAt.toISOString(),
      });

      expect(body).not.toHaveProperty('user');
      expect(body).not.toHaveProperty('userId');
    });

    it('returns 404 when the activation code does not exist', () => {
      return request(app.getHttpServer())
        .get(`/user-activations/${'x'.repeat(72)}`)
        .expect(404);
    });

    it('returns 410 when the activation has expired', async () => {
      const expired = await app.get(SeedFactory).create(UserActivation, {
        expiresAt: new Date(Date.now() - 100),
        user,
      });

      return request(app.getHttpServer())
        .get(`/user-activations/${expired.code}`)
        .expect(410);
    });
  });

  describe('POST /user-activations/:code', () => {
    it('returns 204 and activates the password', async () => {
      await request(app.getHttpServer())
        .post(`/user-activations/${activation.code}`)
        .send({ password: NEW_PASSWORD })
        .expect(204);

      // User can log in with the new password.
      await obtainAuthToken(app, user.email, NEW_PASSWORD);

      // Trying to activate again should fail.
      return request(app.getHttpServer())
        .post(`/user-activations/${activation.code}`)
        .send({ password: NEW_PASSWORD })
        .expect(404);
    });

    it('returns 404 when the activation code does not exist', () => {
      return request(app.getHttpServer())
        .post(`/user-activations/${'x'.repeat(72)}`)
        .send({ password: NEW_PASSWORD })
        .expect(404);
    });

    it('returns 410 when the activation has expired', async () => {
      const expired = await app.get(SeedFactory).create(UserActivation, {
        expiresAt: new Date(Date.now() - 100),
        user,
      });

      return request(app.getHttpServer())
        .post(`/user-activations/${expired.code}`)
        .send({ password: NEW_PASSWORD })
        .expect(410);
    });

    it('returns 400 when the password is shorter than 8 characters', () => {
      return request(app.getHttpServer())
        .post(`/user-activations/${activation.code}`)
        .send({ password: 'short' })
        .expect(400);
    });

    it('returns 400 when the password field is missing', () => {
      return request(app.getHttpServer())
        .post(`/user-activations/${activation.code}`)
        .send({})
        .expect(400);
    });
  });
});
