import request from 'supertest';
import type { App } from 'supertest/types';
import { hash } from 'bcrypt';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { SeedFactory } from '@/seeder/seed.factory';
import { User } from '@/users/entities/user.entity';
import { Auth } from '@/auth/decorators/auth.decorator';
import { ExposeToAdmin } from '@/common/decorators/expose-to-admin.decorator';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

class TestEntity {
  name: string;
  email: string;
}

class TestDto {
  name: string;

  @ExposeToAdmin()
  email: string;
}

@Serialize(TestDto)
@Auth()
@Controller('test/data')
class AuthorFixtureController {
  @Get()
  find() {
    return Object.assign(new TestEntity(), {
      name: 'Alice',
      email: 'test@example.com',
    });
  }
}

const TEST_USER_PASSWORD = 'password';

describe('SerializerInterceptor (e2e)', () => {
  let app: INestApplication<App>;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestServer(
      [AuthModule, UsersModule],
      [AuthorFixtureController],
      [SeedFactory],
    );

    const user = await app.get(SeedFactory).create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
    });

    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
    adminToken = await obtainAdminAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes admin fields to admin', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/test/data')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(body).toHaveProperty('name', 'Alice');
    expect(body).toHaveProperty('email', 'test@example.com');
  });

  it('does not expose admin fields to non-admin', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/test/data')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(body).toHaveProperty('name', 'Alice');
    expect(body).not.toHaveProperty('email');
  });
});
