import request from 'supertest';
import { App } from 'supertest/types';
import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Auth } from '@/auth/decorators/auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { AuthModule } from '@/auth/auth.module';
import {
  createTestServer,
  getAdminEmail,
  getAdminPassword,
  obtainAdminAuthToken,
} from './utils';

// Isolated mock controller used only in this test to verify the decorators.
@Controller('test')
class TestController {
  @Get('protected')
  @Auth()
  getProtected(@CurrentUser() user: User) {
    return { id: user.id, email: user.email };
  }
}

@Module({ controllers: [TestController] })
class TestModule {}

let app: INestApplication<App>;

beforeAll(async () => {
  app = await createTestServer([AuthModule, TestModule]);
});

afterAll(async () => {
  await app.close();
});

describe('AuthController (e2e)', () => {
  let email: string;
  let password: string;

  beforeAll(() => {
    email = getAdminEmail(app);
    password = getAdminPassword(app);
  });

  describe('POST /tokens', () => {
    it('returns 201 with an access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/tokens')
        .send({ email, password })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('does not expose any user fields in the response', async () => {
      const res = await request(app.getHttpServer())
        .post('/tokens')
        .send({ email, password })
        .expect(201);

      expect(res.body.password).toBeUndefined();
      expect(res.body.email).toBeUndefined();
      expect(res.body.id).toBeUndefined();
    });

    it('returns 401 for an incorrect password', () => {
      return request(app.getHttpServer())
        .post('/tokens')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('returns 401 for a non-existent email', () => {
      return request(app.getHttpServer())
        .post('/tokens')
        .send({ email: 'nobody@example.com', password })
        .expect(401);
    });

    it('returns 400 for an invalid email format', () => {
      return request(app.getHttpServer())
        .post('/tokens')
        .send({ email: 'not-an-email', password })
        .expect(400);
    });

    it('returns 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/tokens')
        .send({ email })
        .expect(400);
    });

    it('returns 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/tokens')
        .send({ password })
        .expect(400);
    });
  });
});

describe('@Auth (e2e)', () => {
  it('returns 401 when no Authorization header is provided', () => {
    return request(app.getHttpServer()).get('/test/protected').expect(401);
  });

  it('returns 401 for a malformed token', () => {
    return request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', 'Bearer not.a.valid.jwt')
      .expect(401);
  });

  it('allows access with a valid JWT', async () => {
    const token = await obtainAdminAuthToken(app);

    return request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

describe('@CurrentUser (e2e)', () => {
  it('injects the authenticated user into the route handler', async () => {
    const token = await obtainAdminAuthToken(app);

    const res = await request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe(getAdminEmail(app));
    expect(res.body.id).toBeDefined();
  });
});
