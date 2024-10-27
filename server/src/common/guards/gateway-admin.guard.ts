import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PollsService } from 'src/polls/polls.service';
import { AuthPayload, SocketWithAuth } from 'src/polls/polls.types';
import { WsUnauthorizedException } from '../exceptions/ws.exception';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);

  constructor(
    private readonly pollsService: PollsService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const socket = _context.switchToWs().getClient<SocketWithAuth>();

    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.error('No authorization token provided');
      throw new WsUnauthorizedException('No authorization token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        AuthPayload & { sub: string }
      >(token);

      this.logger.debug('Validating admin using payload', payload);

      const poll = await this.pollsService.getPoll(payload.pollID);

      if (poll.adminID !== payload.sub) {
        throw new WsUnauthorizedException('Admin access required');
      }
      return true;
    } catch {
      throw new WsUnauthorizedException('Admin access required');
    }
  }
}
