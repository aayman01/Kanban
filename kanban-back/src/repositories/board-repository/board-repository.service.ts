import { Injectable } from '@nestjs/common';
import { Board, BoardMember, Column, Prisma, Role, Task } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const DEFAULT_COLUMNS = ['Todo', 'In Progress', 'Done'];

export type BoardWithOwnerRole = Board & { role: typeof Role.OWNER };

export type BoardListRow = Board & {
  role: Role;
  memberCount: number;
  taskCount: number;
};

export type BoardDetail = Board & {
  boardMembers: Array<BoardMember & { user: { email: string } }>;
  columns: Array<Column & { tasks: Task[] }>;
};

export type BoardMemberWithEmail = {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  email: string;
};

export type ColumnOnBoard = Column & { board: Board };

export type TaskOnBoard = Task & {
  column: Column & { board: Board };
};

@Injectable()
export class BoardRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    userId: string,
    name: string,
  ): Promise<BoardWithOwnerRole> {
    return this.prisma.transaction(async (tx) => {
      const board = await tx.board.create({
        data: { name },
      });

      await tx.boardMember.create({
        data: {
          boardId: board.id,
          userId,
          role: Role.OWNER,
        },
      });

      await tx.column.createMany({
        data: DEFAULT_COLUMNS.map((title, position) => ({
          boardId: board.id,
          title,
          position,
        })),
      });

      return { ...board, role: Role.OWNER };
    });
  }

  async findBoardById(id: string): Promise<Board | null> {
    return this.prisma.db().board.findUnique({ where: { id } });
  }

  async listForUser(userId: string): Promise<BoardListRow[]> {
    const boards = await this.prisma.db().board.findMany({
      where: { boardMembers: { some: { userId } } },
      include: {
        boardMembers: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { boardMembers: true } },
        columns: { select: { _count: { select: { tasks: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      role: board.boardMembers[0]?.role ?? Role.VIEWER,
      memberCount: board._count.boardMembers,
      taskCount: board.columns.reduce(
        (sum, column) => sum + column._count.tasks,
        0,
      ),
    }));
  }

  async findBoardDetail(boardId: string): Promise<BoardDetail | null> {
    return this.prisma.db().board.findUnique({
      where: { id: boardId },
      include: {
        boardMembers: {
          include: { user: { select: { email: true } } },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: { orderBy: { position: 'asc' } },
          },
        },
      },
    });
  }

  async findMember(
    boardId: string,
    userId: string,
  ): Promise<BoardMember | null> {
    return this.prisma.db().boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
  }

  async findMemberById(
    boardId: string,
    memberId: string,
  ): Promise<BoardMember | null> {
    const member = await this.prisma.db().boardMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.boardId !== boardId) {
      return null;
    }
    return member;
  }

  async listMembers(boardId: string): Promise<BoardMemberWithEmail[]> {
    const members = await this.prisma.db().boardMember.findMany({
      where: { boardId },
      include: { user: { select: { email: true } } },
      orderBy: { role: 'asc' },
    });
    return members.map((member) => ({
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      role: member.role,
      email: member.user.email,
    }));
  }

  async addMember(data: {
    boardId: string;
    userId: string;
    role: Role;
  }): Promise<BoardMemberWithEmail> {
    const member = await this.prisma.db().boardMember.create({
      data,
      include: { user: { select: { email: true } } },
    });
    return {
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      role: member.role,
      email: member.user.email,
    };
  }

  async updateMemberRole(
    memberId: string,
    role: Role,
  ): Promise<BoardMemberWithEmail> {
    const member = await this.prisma.db().boardMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { email: true } } },
    });
    return {
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      role: member.role,
      email: member.user.email,
    };
  }

  async removeMember(memberId: string): Promise<void> {
    await this.prisma.db().boardMember.delete({ where: { id: memberId } });
  }

  async findColumnOnBoard(
    columnId: string,
    boardId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ColumnOnBoard | null> {
    return this.prisma.db(tx).column.findFirst({
      where: {
        id: columnId,
        ...(boardId ? { boardId } : {}),
      },
      include: { board: true },
    });
  }

  async findTaskOnBoard(
    taskId: string,
    boardId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TaskOnBoard | null> {
    return this.prisma.db(tx).task.findFirst({
      where: {
        id: taskId,
        ...(boardId ? { column: { boardId } } : {}),
      },
      include: { column: { include: { board: true } } },
    });
  }

  async nextTaskPosition(columnId: string): Promise<number> {
    const result = await this.prisma.db().task.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    return (result._max.position ?? -1) + 1;
  }

  async createTask(data: {
    columnId: string;
    title: string;
    description: string | null;
    position: number;
  }): Promise<Task> {
    return this.prisma.db().task.create({ data });
  }

  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      columnId?: string;
      position?: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Task> {
    return this.prisma.db(tx).task.update({
      where: { id: taskId },
      data,
    });
  }

  async lockColumnTasks(
    columnId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.$queryRaw`
      SELECT id FROM "Task"
      WHERE "columnId" = ${columnId}
      ORDER BY "position" ASC
      FOR UPDATE
    `;
  }

  async listTasksInColumn(
    columnId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Task[]> {
    return this.prisma.db(tx).task.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });
  }

  async rebalanceColumn(
    columnId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const tasks = await this.listTasksInColumn(columnId, tx);
    for (let index = 0; index < tasks.length; index += 1) {
      await tx.task.update({
        where: { id: tasks[index].id },
        data: { position: -(index + 1) },
      });
    }
    for (let index = 0; index < tasks.length; index += 1) {
      await tx.task.update({
        where: { id: tasks[index].id },
        data: { position: index + 1 },
      });
    }
  }

  async nextColumnPosition(boardId: string): Promise<number> {
    const result = await this.prisma.db().column.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    return (result._max.position ?? -1) + 1;
  }

  async createColumn(data: {
    boardId: string;
    title: string;
    position: number;
  }): Promise<Column> {
    return this.prisma.db().column.create({ data });
  }

  async updateColumnTitle(columnId: string, title: string): Promise<Column> {
    return this.prisma.db().column.update({
      where: { id: columnId },
      data: { title },
    });
  }
}
