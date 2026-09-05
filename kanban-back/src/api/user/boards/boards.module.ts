import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardAccessService } from './board-access.service';
import { BoardAccessGuard } from './guards/board-access.guard';
import { JwtAuthModule } from '../auth/jwt-auth.module';
import { BoardRepositoryModule } from 'src/repositories/board-repository/board-repository.module';
import { UserRepositoryModule } from 'src/repositories/user-repository/user-repository.module';

@Module({
  imports: [JwtAuthModule, BoardRepositoryModule, UserRepositoryModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardAccessService, BoardAccessGuard],
  exports: [BoardAccessService, BoardAccessGuard, BoardRepositoryModule],
})
export class BoardsModule {}
