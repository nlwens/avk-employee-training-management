import request from 'supertest';
import type { App } from 'supertest/types';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Exclude } from 'class-transformer';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { createTestServer } from './utils';

class AuthorEntity {
  name: string;
  email: string;

  @Exclude()
  apiKey: string;
}

class AuthorDto {
  name: string;

  @Exclude()
  email: string;
}

@Serialize(AuthorDto)
@Controller('test/authors')
class AuthorFixtureController {
  @Get()
  find() {
    return Object.assign(new AuthorEntity(), {
      name: 'Alice',
      email: 'test@example.com',
      apiKey: 's3cr3t',
    });
  }
}

describe('SerializerInterceptor (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestServer(undefined, [AuthorFixtureController]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('strips @Exclude fields from the response', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/test/authors')
      .expect(200);

    expect(body).toHaveProperty('name', 'Alice');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('apiKey');
  });
});
