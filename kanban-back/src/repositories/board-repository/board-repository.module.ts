import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BoardRepositoryService } from './board-repository.service';

@Module({
  imports: [PrismaModule],
  providers: [BoardRepositoryService],
  exports: [BoardRepositoryService],
})
export class BoardRepositoryModule {}
