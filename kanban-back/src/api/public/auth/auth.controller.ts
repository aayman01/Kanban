import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema } from './dto/register.dto';
import type { RegisterDto } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import type { LoginDto } from './dto/login.dto';
import { AppConfigService } from 'src/config/app_config/app_config.service';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearCookieOptions,
  durationToMs,
} from './cookies';
import { sendResponse } from 'src/common/helpers/send.reponse';

@Controller('public/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post('register')
  async register(
    @Body({ schema: registerSchema }) body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    this.setAuthCookies(res, result.tokens);
    return sendResponse({
      success: true,
      message: 'Registered successfully',
      data: result.user,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body({ schema: loginSchema }) body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    this.setAuthCookies(res, result.tokens);
    return sendResponse({
      success: true,
      message: 'Logged in successfully',
      data: result.user,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(
      req.cookies?.[REFRESH_COOKIE],
    );
    this.setAuthCookies(res, result.tokens);
    return sendResponse({
      success: true,
      message: 'Token refreshed',
      data: result.user,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return sendResponse({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const secure = this.config.isProduction;
    res.cookie(
      ACCESS_COOKIE,
      tokens.accessToken,
      authCookieOptions(secure, durationToMs(this.config.jwtAccessExpiresIn)),
    );
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      authCookieOptions(secure, durationToMs(this.config.jwtRefreshExpiresIn)),
    );
  }

  private clearAuthCookies(res: Response) {
    const secure = this.config.isProduction;
    res.clearCookie(ACCESS_COOKIE, clearCookieOptions(secure));
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions(secure));
  }
}
