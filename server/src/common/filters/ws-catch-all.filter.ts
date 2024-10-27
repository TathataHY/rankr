import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { SocketWithAuth } from '../../polls/polls.types';
import {
  WsBadRequestException,
  WsException,
  WsUnknownException,
} from '../exceptions/ws.exception';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(_exception: Error, host: ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (_exception instanceof BadRequestException) {
      const exception = _exception.getResponse();

      const wsException = new WsBadRequestException(
        exception['message'] ?? exception ?? _exception.name,
      );

      socket.emit('exception', wsException.getError());
      return;
    }

    if (_exception instanceof WsException) {
      socket.emit('exception', _exception.getError());
      return;
    }

    const wsException = new WsUnknownException(_exception.message);
    socket.emit('exception', wsException.getError());
  }
}
