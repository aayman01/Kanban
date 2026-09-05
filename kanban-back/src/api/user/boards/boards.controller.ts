import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuth } from '../auth/decorators/jwt-auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BoardAccess } from './decorators/board-access.decorator';
import type { RequestUser } from 'src/types/auth';
import { sendResponse } from 'src/common/helpers/send.reponse';
import { createBoardSchema } from './dto/create-board.dto';
import type { CreateBoardDto } from './dto/create-board.dto';
import { addBoardMemberSchema } from './dto/add-board-member.dto';
import type { AddBoardMemberDto } from './dto/add-board-member.dto';
import { updateBoardMemberSchema } from './dto/update-board-member.dto';
import type { UpdateBoardMemberDto } from './dto/update-board-member.dto';
import { createTaskSchema } from './dto/create-task.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import { updateTaskSchema } from './dto/update-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import { createColumnSchema } from './dto/create-column.dto';
import type { CreateColumnDto } from './dto/create-column.dto';
import { updateColumnSchema } from './dto/update-column.dto';
import type { UpdateColumnDto } from './dto/update-column.dto';
import { moveTaskSchema } from './dto/move-task.dto';
import type { MoveTaskDto } from './dto/move-task.dto';

@JwtAuth()
@Controller('user/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body({ schema: createBoardSchema }) body: CreateBoardDto,
  ) {
    const data = await this.boardsService.create(user.id, body.name);
    return sendResponse({
      success: true,
      message: 'Board created',
      data,
    });
  }

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.boardsService.list(user.id);
    return sendResponse({
      success: true,
      message: 'Boards',
      data,
    });
  }

  @Get(':boardId')
  @BoardAccess('member')
  async get(
    @CurrentUser() user: RequestUser,
    @Param('boardId') boardId: string,
  ) {
    const data = await this.boardsService.getBoardById(boardId, user.id);
    return sendResponse({
      success: true,
      message: 'Board',
      data,
    });
  }

  @Get(':boardId/members')
  @BoardAccess('member')
  async listMembers(@Param('boardId') boardId: string) {
    const data = await this.boardsService.listMembers(boardId);
    return sendResponse({
      success: true,
      message: 'Board members',
      data,
    });
  }

  @Post(':boardId/members')
  @BoardAccess('owner')
  async addMember(
    @Param('boardId') boardId: string,
    @Body({ schema: addBoardMemberSchema }) body: AddBoardMemberDto,
  ) {
    const data = await this.boardsService.addMember(
      boardId,
      body.email,
      body.role,
    );
    return sendResponse({
      success: true,
      message: 'Member added',
      data,
    });
  }

  @Patch(':boardId/members/:memberId')
  @BoardAccess('owner')
  async updateMember(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body({ schema: updateBoardMemberSchema }) body: UpdateBoardMemberDto,
  ) {
    const data = await this.boardsService.updateMemberRole(
      boardId,
      memberId,
      body.role,
    );
    return sendResponse({
      success: true,
      message: 'Member updated',
      data,
    });
  }

  @Delete(':boardId/members/:memberId')
  @BoardAccess('owner')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.boardsService.removeMember(boardId, memberId);
    return sendResponse({
      success: true,
      message: 'Member removed',
      data: null,
    });
  }

  @Post(':boardId/columns')
  @BoardAccess('editor')
  async createColumn(
    @Param('boardId') boardId: string,
    @Body({ schema: createColumnSchema }) body: CreateColumnDto,
  ) {
    const data = await this.boardsService.createColumn(boardId, body.title);
    return sendResponse({
      success: true,
      message: 'Column created',
      data,
    });
  }

  @Patch(':boardId/columns/:columnId')
  @BoardAccess('editor')
  async updateColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body({ schema: updateColumnSchema }) body: UpdateColumnDto,
  ) {
    const data = await this.boardsService.updateColumn(
      boardId,
      columnId,
      body.title,
    );
    return sendResponse({
      success: true,
      message: 'Column updated',
      data,
    });
  }

  @Post(':boardId/columns/:columnId/tasks')
  @BoardAccess('editor')
  async createTask(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body({ schema: createTaskSchema }) body: CreateTaskDto,
  ) {
    const data = await this.boardsService.createTask(
      boardId,
      columnId,
      body.title,
      body.description,
    );
    return sendResponse({
      success: true,
      message: 'Task created',
      data,
    });
  }

  @Patch(':boardId/tasks/:taskId')
  @BoardAccess('editor')
  async updateTask(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body({ schema: updateTaskSchema }) body: UpdateTaskDto,
  ) {
    const data = await this.boardsService.updateTask(boardId, taskId, body);
    return sendResponse({
      success: true,
      message: 'Task updated',
      data,
    });
  }

  @Post(':boardId/tasks/:taskId/move')
  @BoardAccess('editor')
  async moveTask(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body({ schema: moveTaskSchema }) body: MoveTaskDto,
  ) {
    const data = await this.boardsService.moveTask(boardId, taskId, body);
    return sendResponse({
      success: true,
      message: 'Task moved',
      data,
    });
  }
}
