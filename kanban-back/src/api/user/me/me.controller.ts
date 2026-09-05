import { Controller, Get } from '@nestjs/common';
import { MeService } from './me.service';
import { JwtAuth } from '../auth/decorators/jwt-auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from 'src/types/auth';
import { sendResponse } from 'src/common/helpers/send.reponse';

@JwtAuth()
@Controller('user/me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  me(@CurrentUser() user: RequestUser) {
    return sendResponse({
      success: true,
      message: 'Current user',
      data: this.meService.getMe(user),
    });
  }
}
