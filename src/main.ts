import { config } from 'dotenv';
config();
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './helpers/socket-io.adapter';
import * as admin from 'firebase-admin';
var serviceAccount = require("../fortress-firebase.json");


import { ServiceAccount } from "firebase-admin";
import { TransformInterceptor } from './helpers/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useWebSocketAdapter(new SocketIoAdapter(app, true));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Fortress API')
    .setDescription('Fortress API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8083);
}
bootstrap();
