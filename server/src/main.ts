import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './common/adapters/socket-io.adapter';

async function bootstrap() {
  const logger = new Logger('Main (main.ts)');

  // Crear la aplicación NestJS
  const app = await NestFactory.create(AppModule);

  // Obtener el servicio de configuración
  const configService = app.get(ConfigService);

  // Configurar puertos
  const port = parseInt(configService.get('PORT'));
  const clientPort = parseInt(configService.get('CLIENT_PORT'));

  // Configurar CORS
  configureCors(app, clientPort);

  // Configurar socket.io
  configureSocketIo(app, configService);

  // Iniciar el servidor
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}

function configureCors(app, clientPort: number) {
  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      new RegExp(`^http://192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$`),
    ],
  });
}

function configureSocketIo(
  app: INestApplication,
  configService: ConfigService,
) {
  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));
}

bootstrap();
