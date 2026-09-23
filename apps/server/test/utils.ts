import request from 'supertest';
import {
  INestApplication,
  ModuleMetadata,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { useContainer } from 'class-validator';
import type { App } from 'supertest/types';
import { I18nModule } from '@/i18n/i18n.module';
import { ValidatorsModule } from '@/validators/validators.module';
import { TypeOrmExceptionFilter } from '@/common/filters/typeorm-exception.filter';

export async function createTestServer(
  imports: ModuleMetadata['imports'] = undefined,
  controllers: ModuleMetadata['controllers'] = undefined,
  providers: ModuleMetadata['providers'] = undefined,
): Promise<INestApplication<App>> {
  const typeorm = TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  });

  const defaultImports = [
    typeorm,
    I18nModule,
    ValidatorsModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    await ConfigModule.forRoot({ isGlobal: true }),
  ];

  const module: TestingModule = await Test.createTestingModule({
    imports: imports ? [...imports, ...defaultImports] : defaultImports,
    controllers,
    providers,
  }).compile();

  const app = module.createNestApplication();

  useContainer(module, { fallbackOnErrors: true });
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.init();

  return app;
}

/**
 * Send an HTTP request to obtain an access token.
 * @param app Created test application.
 * @param email Email to log in with.
 * @param password Password to log in with.
 */
export async function obtainAuthToken(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/tokens')
    .send({ email, password })
    .expect(201);

  expect(response.body).toHaveProperty('accessToken', expect.any(String));

  return response.body.accessToken as string;
}

export async function obtainAdminAuthToken(app: INestApplication<App>) {
  const email = getAdminEmail(app);
  const password = getAdminPassword(app);

  return obtainAuthToken(app, email, password);
}

export function getAdminEmail(app: INestApplication<App>) {
  return app.get(ConfigService).get<string>('ADMIN_EMAIL', 'admin@example.com');
}

export function getAdminPassword(app: INestApplication<App>) {
  return app.get(ConfigService).get<string>('ADMIN_PASSWORD', 'password');
}
