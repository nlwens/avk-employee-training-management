import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const uploadLocation = configService.get<string>(
    'FILE_UPLOAD_LOCATION',
    'data-storage/uploads',
  );

  // This is not correct or safe, but we are not deploying yet... yolo!
  app.enableCors({
    origin: true,
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AVK Employees Training Management')
      .setVersion('0.0.1')
      .addBearerAuth()
      .addTag('Authentication') // Prioritize authentication-related endpoints so that they appear first.
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, documentFactory, {
      jsonDocumentUrl: 'swagger/json',
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
      },
    });
  }

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useStaticAssets(join(process.cwd(), uploadLocation), {
    prefix: `/${uploadLocation}`,
  });

  await app.listen(configService.get<number>('SERVER_PORT') ?? 3000);
}

void bootstrap();
