import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const httpAdapter = app.getHttpAdapter().getInstance();
  const nodeEnv = configService.get<string>('nodeEnv', 'development');

  httpAdapter.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Wallet API is running',
      api: '/api/v1',
      ...(nodeEnv !== 'production' ? { docs: '/docs' } : {}),
    });
  });

  httpAdapter.head('/', (_req, res) => {
    res.sendStatus(200);
  });

  // Serve uploaded avatars as static files
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/public' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const corsOrigin = configService.get<string>(
    'corsOrigin',
    'http://localhost:5173',
  );
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Bingo Game API')
    .setDescription('Multiplayer Bingo Game API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (nodeEnv !== 'production') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = configService.get<number>('port', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  if (nodeEnv !== 'production') {
    logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  }
  logger.log(`🎮 WebSocket namespace: ws://localhost:${port}/game`);
}

bootstrap().catch((error: unknown) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});
