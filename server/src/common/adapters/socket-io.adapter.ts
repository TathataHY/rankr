import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'http';
import { Server } from 'socket.io';
import { SocketWithAuth } from 'src/polls/polls.types';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = this.configService.get<number>('CLIENT_PORT');

    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`^http://192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$`),
      ],
    };

    this.logger.log(`Configuring socket.io with cors: ${JSON.stringify(cors)}`);

    const server: Server = super.createIOServer(port, {
      ...options,
      cors,
    });

    const jwtService = this.app.get(JwtService);

    server.of('polls').use(createTokenMiddleware(jwtService, this.logger));

    return server;
  }
}

const createTokenMiddleware =
  (jwtService: JwtService, logger: Logger) =>
  async (socket: SocketWithAuth, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    logger.debug(`Validating auth token before connection: ${token}`);

    try {
      const payload = await jwtService.verifyAsync(token);
      socket.userID = payload.sub;
      socket.pollID = payload.pollID;
      socket.name = payload.name;
      next();
    } catch {
      next(new Error('FORBIDDEN'));
    }
  };
