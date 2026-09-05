import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { RequestBoardAccess } from 'src/types/auth';

export const BoardAccessUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestBoardAccess => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.boardAccess!;
  },
);
