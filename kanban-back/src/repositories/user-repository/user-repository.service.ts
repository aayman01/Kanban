import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return await this.prisma.db(tx).user.findUnique({ where: { email } });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return await this.prisma.db(tx).user.findUnique({ where: { id } });
  }

  async create(
    data: Prisma.UserCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return await this.prisma.db(tx).user.create({ data });
  }
}
