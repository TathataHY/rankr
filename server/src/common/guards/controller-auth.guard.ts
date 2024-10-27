import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithAuth } from 'src/polls/polls.types';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const request: RequestWithAuth = _context
      .switchToHttp()
      .getRequest<RequestWithAuth>();

    this.logger.debug(
      'Verifying authentication token in request body',
      request.body,
    );

    const { accessToken } = request.body;

    if (!accessToken) {
      throw new ForbiddenException('Access token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(accessToken);

      request.userID = payload.sub;
      request.pollID = payload.pollID;
      request.name = payload.name;

      return true;
    } catch {
      throw new ForbiddenException('Invalid access token');
    }
  }
}
