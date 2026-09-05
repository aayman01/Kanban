import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  // === App ===
  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }

  get port(): AppEnv['PORT'] {
    return this.configService.getOrThrow('PORT');
  }

  get databaseUrl(): AppEnv['DATABASE_URL'] {
    return this.configService.getOrThrow('DATABASE_URL');
  }

  get allowedOrigins(): AppEnv['ALLOWED_ORIGINS'] {
    return this.configService.getOrThrow('ALLOWED_ORIGINS');
  }

  get jwtAccessSecret(): AppEnv['JWT_ACCESS_SECRET'] {
    return this.configService.getOrThrow('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): AppEnv['JWT_REFRESH_SECRET'] {
    return this.configService.getOrThrow('JWT_REFRESH_SECRET');
  }

  get jwtAccessExpiresIn(): AppEnv['JWT_ACCESS_EXPIRES_IN'] {
    return this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN');
  }

  get jwtRefreshExpiresIn(): AppEnv['JWT_REFRESH_EXPIRES_IN'] {
    return this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
