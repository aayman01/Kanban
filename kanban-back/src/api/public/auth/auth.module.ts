import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepositoryModule } from 'src/repositories/user-repository/user-repository.module';
import { AppConfigService } from 'src/config/app_config/app_config.service';
import { durationToMs } from './cookies';

@Module({
  imports: [
    UserRepositoryModule,
    JwtModule.registerAsync({
      global: true,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtAccessSecret,
        signOptions: {
          expiresIn: durationToMs(config.jwtAccessExpiresIn),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
