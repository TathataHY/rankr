import { WsException as NestWsException } from '@nestjs/websockets';

type WsExceptionType = 'BadRequest' | 'Unauthorized' | 'Unknown';

export class WsException extends NestWsException {
  readonly type: WsExceptionType;

  constructor(type: WsExceptionType, message: string) {
    super({ type, message });
    this.type = type;
  }
}

export class WsBadRequestException extends WsException {
  constructor(message: string) {
    super('BadRequest', message);
  }
}

export class WsUnauthorizedException extends WsException {
  constructor(message: string) {
    super('Unauthorized', message);
  }
}

export class WsUnknownException extends WsException {
  constructor(message: string) {
    super('Unknown', message);
  }
}
