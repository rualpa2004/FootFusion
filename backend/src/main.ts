import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeFirebase } from './config/firebase.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);
  app.enableCors({origin: 'http://localhost:5173'})
  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
