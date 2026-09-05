import { Module } from '@nestjs/common';
import { MeModule } from './me/me.module';
import { BoardsModule } from './boards/boards.module';

@Module({
  imports: [MeModule, BoardsModule],
})
export class UserApiModule {}
