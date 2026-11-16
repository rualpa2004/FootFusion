import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeFirebase } from './config/firebase.config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);
  app.enableCors({origin: 'http://localhost:5173'})
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))

  // API documentation generated from the controllers and DTOs:
  // Swagger UI at /api/docs and the OpenAPI spec (importable in Postman) at /api/docs-json
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FootFusion API')
      .setVersion('1.0')
      .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Firebase ID token'})
      .build();
    SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
