import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { FileLoggerService } from './common/logger/file-logger.service';
import { globalRateLimiter } from './common/middleware/security.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(FileLoggerService);

  // Apply Helmet Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // allow static upload resources
    }),
  );

  // Apply Global Rate Limiter Security Middleware
  app.use(globalRateLimiter);

  // Payload body size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-role', 'Authorization'],
    credentials: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Gameunity Backend API')
    .setDescription('In-memory NestJS backend for frontend integration and academic evaluation')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local Dev Server')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-role',
        description: 'RBAC role header: admin | community_manager | moderator | user',
      },
      'x-role',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const docsPath = join(process.cwd(), 'docs');
  mkdirSync(docsPath, { recursive: true });
  writeFileSync(join(docsPath, 'swagger.json'), JSON.stringify(document, null, 2), 'utf8');

  // Process-level uncaught async exception handlers
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, err.stack, 'Process');
  });

  process.on('unhandledRejection', (reason) => {
    const reasonText = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error(`Unhandled Rejection: ${reasonText}`, stack, 'Process');
  });

  await app.listen(3000);
  logger.log('Gameunity Backend successfully listening on http://localhost:3000', 'Bootstrap');
}

void bootstrap();
