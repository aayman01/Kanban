import { RequestUser, RequestBoardAccess } from 'src/types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      boardAccess?: RequestBoardAccess;
    }
  }
}

export {};
