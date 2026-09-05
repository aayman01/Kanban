import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepositoryService } from 'src/repositories/user-repository/user-repository.service';
import { AppConfigService } from 'src/config/app_config/app_config.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { AuthUserDto } from './dto/auth-response.dto';
import { JwtPayload } from 'src/types/auth';
import { durationToMs } from './cookies';

const BCRYPT_ROUNDS = 12;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: AuthUserDto;
  tokens: AuthTokens;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepositoryService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.users.create({
        email: dto.email,
        password,
      });
      return this.issueSession(user.id, user.email);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user.id, user.email);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.users.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueSession(user.id, user.email);
  }

  private issueSession(userId: string, email: string): AuthResult {
    return {
      user: { id: userId, email },
      tokens: this.signTokens(userId, email),
    };
  }

  private signTokens(userId: string, email: string): AuthTokens {
    const accessPayload: JwtPayload = { sub: userId, email, typ: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, typ: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: durationToMs(this.config.jwtAccessExpiresIn),
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: durationToMs(this.config.jwtRefreshExpiresIn),
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string | undefined): JwtPayload {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });
      if (payload.typ !== 'refresh' || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
