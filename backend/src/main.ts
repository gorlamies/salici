import 'reflect-metadata';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupSwagger } from './swagger/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true })
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  setupSwagger(app);
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
