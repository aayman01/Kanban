import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { JwtAuthModule } from '../auth/jwt-auth.module';

@Module({
  imports: [JwtAuthModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
