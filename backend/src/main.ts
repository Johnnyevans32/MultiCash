import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";

import { AppModule } from "@/app.module";
import { HttpExceptionFilter } from "@/core/middlewares/exception";
import { corsConfig } from "@/cors.config";
import configuration, { Configuration } from "./core/services/configuration";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { cors: corsConfig }
  );
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const configService = app.get(ConfigService);
  const port = configService.get<string>("server.port");
  const host = configService.get<string>("server.host");

  await app.listen(port, host);
  console.log(`application is running on: ${await app.getUrl()}`);
}
bootstrap();
