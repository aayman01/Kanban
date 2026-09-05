import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { BoardAccessGuard } from '../guards/board-access.guard';

export const BOARD_ACCESS_KEY = 'boardAccessRole';

export type BoardAccessRole = 'member' | 'editor' | 'owner';

export function BoardAccess(role: BoardAccessRole) {
  return applyDecorators(
    SetMetadata(BOARD_ACCESS_KEY, role),
    UseGuards(BoardAccessGuard),
  );
}
