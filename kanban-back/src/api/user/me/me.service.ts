import { Injectable } from '@nestjs/common';
import { RequestUser } from 'src/types/auth';
import { MeResponseDto } from './dto/me-response.dto';

@Injectable()
export class MeService {
  getMe(user: RequestUser): MeResponseDto {
    return { id: user.id, email: user.email };
  }
}
