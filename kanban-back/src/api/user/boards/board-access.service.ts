import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardMember, Role } from '@prisma/client';
import { BoardRepositoryService } from 'src/repositories/board-repository/board-repository.service';

@Injectable()
export class BoardAccessService {
  constructor(private readonly boards: BoardRepositoryService) {}

  async requireMember(boardId: string, userId: string): Promise<BoardMember> {
    const board = await this.boards.findBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    const member = await this.boards.findMember(boardId, userId);
    if (!member) {
      throw new ForbiddenException('You do not have access to this board');
    }
    return member;
  }

  async requireOwner(boardId: string, userId: string): Promise<BoardMember> {
    const member = await this.requireMember(boardId, userId);
    if (member.role !== Role.OWNER) {
      throw new ForbiddenException('Only the board owner can do this');
    }
    return member;
  }

  async requireEditor(boardId: string, userId: string): Promise<BoardMember> {
    const member = await this.requireMember(boardId, userId);
    if (member.role !== Role.OWNER && member.role !== Role.EDITOR) {
      throw new ForbiddenException('You do not have edit access to this board');
    }
    return member;
  }
}
