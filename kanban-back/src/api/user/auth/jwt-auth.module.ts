import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRepositoryModule } from 'src/repositories/user-repository/user-repository.module';

@Module({
  imports: [UserRepositoryModule],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, UserRepositoryModule],
})
export class JwtAuthModule {}
