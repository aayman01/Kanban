import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BoardAccessService } from '../board-access.service';
import {
  BOARD_ACCESS_KEY,
  type BoardAccessRole,
} from '../decorators/board-access.decorator';
import { BoardRepositoryService } from 'src/repositories/board-repository/board-repository.service';

@Injectable()
export class BoardAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly boards: BoardRepositoryService,
    private readonly access: BoardAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role =
      this.reflector.getAllAndOverride<BoardAccessRole>(BOARD_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'member';

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const boardId = firstParam(request.params.boardId);
    const columnId = firstParam(request.params.columnId);
    const taskId = firstParam(request.params.taskId);
    const resolvedBoardId = await this.resolveBoardId(
      boardId,
      columnId,
      taskId,
    );

    const member =
      role === 'owner'
        ? await this.access.requireOwner(resolvedBoardId, user.id)
        : role === 'editor'
          ? await this.access.requireEditor(resolvedBoardId, user.id)
          : await this.access.requireMember(resolvedBoardId, user.id);

    request.boardAccess = { boardId: resolvedBoardId, member };
    return true;
  }

  private async resolveBoardId(
    boardId?: string,
    columnId?: string,
    taskId?: string,
  ): Promise<string> {
    if (columnId) {
      const column = await this.boards.findColumnOnBoard(columnId, boardId);
      if (!column) {
        throw new NotFoundException('Column not found');
      }
      return column.boardId;
    }

    if (taskId) {
      const task = await this.boards.findTaskOnBoard(taskId, boardId);
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      return task.column.boardId;
    }

    if (boardId) {
      return boardId;
    }

    throw new BadRequestException('Missing board context');
  }
}

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
