import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepositoryService } from 'src/repositories/user-repository/user-repository.service';
import { ACCESS_COOKIE } from 'src/api/public/auth/cookies';
import { JwtPayload } from 'src/types/auth';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly users: UserRepositoryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[ACCESS_COOKIE];

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.typ !== 'access' || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Authentication required');
      }

      const user = await this.users.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Authentication required');
      }

      request.user = { id: user.id, email: user.email };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication required');
    }
  }
}
