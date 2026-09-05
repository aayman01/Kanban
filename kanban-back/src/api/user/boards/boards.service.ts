import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { BoardRepositoryService } from 'src/repositories/board-repository/board-repository.service';
import { UserRepositoryService } from 'src/repositories/user-repository/user-repository.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
  BoardDetailDto,
  BoardListItemDto,
  BoardResponseDto,
  BoardTaskDto,
  ColumnResponseDto,
} from './dto/board-response.dto';
import type { BoardMemberResponseDto } from './dto/board-member-response.dto';
import type { BoardMemberWithEmail } from 'src/repositories/board-repository/board-repository.service';
import { midpoint, neighborsAreAdjacent } from './task-position';

type ShareableRole = Extract<Role, 'EDITOR' | 'VIEWER'>;

@Injectable()
export class BoardsService {
  constructor(
    private readonly boards: BoardRepositoryService,
    private readonly users: UserRepositoryService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, name: string): Promise<BoardResponseDto> {
    const board = await this.boards.createWithOwner(userId, name);
    return {
      id: board.id,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      role: 'OWNER',
    };
  }

  async list(userId: string): Promise<BoardListItemDto[]> {
    const boards = await this.boards.listForUser(userId);
    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      role: board.role,
      memberCount: board.memberCount,
      taskCount: board.taskCount,
    }));
  }

  async getBoardById(boardId: string, userId: string): Promise<BoardDetailDto> {
    const board = await this.boards.findBoardDetail(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    const membership = board.boardMembers.find(
      (member) => member.userId === userId,
    );
    return {
      id: board.id,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      role: membership?.role ?? 'VIEWER',
      members: board.boardMembers.map((member) => ({
        id: member.id,
        boardId: member.boardId,
        userId: member.userId,
        email: member.user.email,
        role: member.role,
      })),
      columns: board.columns.map((column) => ({
        id: column.id,
        boardId: column.boardId,
        title: column.title,
        position: column.position,
        tasks: column.tasks.map((task) => ({
          id: task.id,
          columnId: task.columnId,
          title: task.title,
          description: task.description,
          position: task.position,
        })),
      })),
    };
  }

  async listMembers(boardId: string): Promise<BoardMemberResponseDto[]> {
    const members = await this.boards.listMembers(boardId);
    return members.map(toMemberResponse);
  }

  async addMember(
    boardId: string,
    email: string,
    role: ShareableRole,
  ): Promise<BoardMemberResponseDto> {
    const invitee = await this.users.findByEmail(email);
    if (!invitee) {
      throw new NotFoundException('No user with that email');
    }

    const existing = await this.boards.findMember(boardId, invitee.id);
    if (existing) {
      throw new ConflictException(
        'This user is already a member of this board',
      );
    }

    try {
      const member = await this.boards.addMember({
        boardId,
        userId: invitee.id,
        role,
      });
      return toMemberResponse(member);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This user is already a member of this board',
        );
      }
      throw error;
    }
  }

  async updateMemberRole(
    boardId: string,
    memberId: string,
    role: ShareableRole,
  ): Promise<BoardMemberResponseDto> {
    const member = await this.boards.findMemberById(boardId, memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.role === Role.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }
    const updated = await this.boards.updateMemberRole(memberId, role);
    return toMemberResponse(updated);
  }

  async removeMember(boardId: string, memberId: string): Promise<void> {
    const member = await this.boards.findMemberById(boardId, memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.role === Role.OWNER) {
      throw new ForbiddenException('Cannot remove the board owner');
    }
    await this.boards.removeMember(memberId);
  }

  async createTask(
    boardId: string,
    columnId: string,
    title: string,
    description?: string | null,
  ): Promise<BoardTaskDto> {
    const column = await this.boards.findColumnOnBoard(columnId, boardId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    const position = await this.boards.nextTaskPosition(columnId);
    const task = await this.boards.createTask({
      columnId,
      title,
      description: description?.trim() ? description.trim() : null,
      position,
    });
    return toTaskResponse(task);
  }

  async updateTask(
    boardId: string,
    taskId: string,
    patch: {
      title?: string;
      description?: string | null;
      columnId?: string;
    },
  ): Promise<BoardTaskDto> {
    const existing = await this.boards.findTaskOnBoard(taskId, boardId);
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const data: {
      title?: string;
      description?: string | null;
      columnId?: string;
      position?: number;
    } = {};

    if (patch.title !== undefined) {
      data.title = patch.title;
    }
    if (patch.description !== undefined) {
      data.description = patch.description?.trim()
        ? patch.description.trim()
        : null;
    }
    if (patch.columnId && patch.columnId !== existing.columnId) {
      const column = await this.boards.findColumnOnBoard(
        patch.columnId,
        boardId,
      );
      if (!column) {
        throw new NotFoundException('Column not found');
      }
      data.columnId = patch.columnId;
      data.position = await this.boards.nextTaskPosition(patch.columnId);
    }

    const task = await this.boards.updateTask(taskId, data);
    return toTaskResponse(task);
  }

  async createColumn(
    boardId: string,
    title: string,
  ): Promise<ColumnResponseDto> {
    const position = await this.boards.nextColumnPosition(boardId);
    const column = await this.boards.createColumn({
      boardId,
      title,
      position,
    });
    return toColumnResponse(column);
  }

  async updateColumn(
    boardId: string,
    columnId: string,
    title: string,
  ): Promise<ColumnResponseDto> {
    const existing = await this.boards.findColumnOnBoard(columnId, boardId);
    if (!existing) {
      throw new NotFoundException('Column not found');
    }
    const column = await this.boards.updateColumnTitle(columnId, title);
    return toColumnResponse(column);
  }

  async moveTask(
    boardId: string,
    taskId: string,
    input: {
      columnId: string;
      prevTaskId?: string | null;
      nextTaskId?: string | null;
    },
  ): Promise<BoardTaskDto> {
    const prevTaskId = input.prevTaskId ?? null;
    const nextTaskId = input.nextTaskId ?? null;
    if (prevTaskId === taskId || nextTaskId === taskId) {
      throw new BadRequestException('Cannot use the moving task as a neighbor');
    }

    try {
      return await this.runMoveTask(boardId, taskId, {
        columnId: input.columnId,
        prevTaskId,
        nextTaskId,
        rebalanceFirst: false,
      });
    } catch (error) {
      if (!isUniqueConflict(error)) {
        throw error;
      }
      try {
        return await this.runMoveTask(boardId, taskId, {
          columnId: input.columnId,
          prevTaskId,
          nextTaskId,
          rebalanceFirst: true,
        });
      } catch {
        throw new ConflictException('Task order changed. Retry the move.');
      }
    }
  }

  private async runMoveTask(
    boardId: string,
    taskId: string,
    input: {
      columnId: string;
      prevTaskId: string | null;
      nextTaskId: string | null;
      rebalanceFirst: boolean;
    },
  ): Promise<BoardTaskDto> {
    return this.prisma.transaction(
      async (tx) => {
        const existing = await this.boards.findTaskOnBoard(taskId, boardId, tx);
        if (!existing) {
          throw new NotFoundException('Task not found');
        }

        const destination = await this.boards.findColumnOnBoard(
          input.columnId,
          boardId,
          tx,
        );
        if (!destination) {
          throw new NotFoundException('Column not found');
        }

        const lockIds = [
          ...new Set([input.columnId, existing.columnId]),
        ].sort();
        for (const columnId of lockIds) {
          await this.boards.lockColumnTasks(columnId, tx);
        }

        if (input.rebalanceFirst) {
          await this.boards.rebalanceColumn(input.columnId, tx);
        }

        const destTasks = await this.boards.listTasksInColumn(
          input.columnId,
          tx,
        );
        if (
          !neighborsAreAdjacent(
            destTasks,
            taskId,
            input.prevTaskId,
            input.nextTaskId,
          )
        ) {
          throw new ConflictException('Task order changed. Retry the move.');
        }

        const position = await this.resolveMovePosition(
          tx,
          input.columnId,
          input.prevTaskId,
          input.nextTaskId,
        );
        const task = await this.boards.updateTask(
          taskId,
          { columnId: input.columnId, position },
          tx,
        );
        return toTaskResponse(task);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async resolveMovePosition(
    tx: Prisma.TransactionClient,
    columnId: string,
    prevTaskId: string | null,
    nextTaskId: string | null,
  ): Promise<number> {
    const tasks = await this.boards.listTasksInColumn(columnId, tx);
    const prev = prevTaskId
      ? tasks.find((task) => task.id === prevTaskId)
      : undefined;
    const next = nextTaskId
      ? tasks.find((task) => task.id === nextTaskId)
      : undefined;
    const position = midpoint(prev?.position, next?.position);
    if (position !== 'rebalance') {
      return position;
    }
    await this.boards.rebalanceColumn(columnId, tx);
    const refreshed = await this.boards.listTasksInColumn(columnId, tx);
    const prevAgain = prevTaskId
      ? refreshed.find((task) => task.id === prevTaskId)
      : undefined;
    const nextAgain = nextTaskId
      ? refreshed.find((task) => task.id === nextTaskId)
      : undefined;
    const nextPosition = midpoint(prevAgain?.position, nextAgain?.position);
    if (nextPosition === 'rebalance') {
      throw new ConflictException('Task order changed. Retry the move.');
    }
    return nextPosition;
  }
}

function toColumnResponse(column: {
  id: string;
  boardId: string;
  title: string;
  position: number;
}): ColumnResponseDto {
  return {
    id: column.id,
    boardId: column.boardId,
    title: column.title,
    position: column.position,
  };
}

function toTaskResponse(task: {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
}): BoardTaskDto {
  return {
    id: task.id,
    columnId: task.columnId,
    title: task.title,
    description: task.description,
    position: task.position,
  };
}
function toMemberResponse(
  member: BoardMemberWithEmail,
): BoardMemberResponseDto {
  return {
    id: member.id,
    boardId: member.boardId,
    userId: member.userId,
    email: member.email,
    role: member.role,
  };
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
